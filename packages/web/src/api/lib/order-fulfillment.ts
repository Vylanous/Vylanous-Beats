import { and, eq } from "drizzle-orm";
import { db } from "../database";
import {
  beats,
  orderDeliveries,
  orderItems,
  orders,
  stripeWebhookEvents,
} from "../database/schema";
import { activateOrderEntitlements } from "./customer-portal";
import { sendDeliveryEmail } from "./email";
import { rid } from "./util";

export type StripeFulfillmentResult =
  | { status: "fulfilled" | "already_paid"; orderId: string; delivery: "sent" | "failed" }
  | { status: "not_found" | "session_mismatch" | "cancelled" };

type StripeWebhookEventInput = {
  eventId: string;
  eventType: string;
  checkoutSessionId: string;
  orderId?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Unknown webhook processing error";
}

/**
 * Claims a Stripe delivery event. A failed event can be retried by Stripe, while
 * a finished or in-progress duplicate is safely acknowledged without rerunning
 * fulfillment.
 */
export async function beginStripeWebhookEvent(input: StripeWebhookEventInput) {
  const existing = await db
    .select()
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.providerEventId, input.eventId))
    .limit(1);

  const now = new Date().toISOString();
  if (existing[0]) {
    if (existing[0].status === "fulfilled" || existing[0].status === "ignored") {
      return { claimed: false as const };
    }
    // Retry failed or interrupted processing. Fulfillment and delivery below are
    // independently idempotent, so a safe retry is preferable to a stuck event.
    await db
      .update(stripeWebhookEvents)
      .set({
        status: "processing",
        lastError: "",
        checkoutSessionId: input.checkoutSessionId,
        orderId: input.orderId || "",
        processedAt: null,
      })
      .where(eq(stripeWebhookEvents.id, existing[0].id));
    return { claimed: true as const };
  }

  try {
    await db.insert(stripeWebhookEvents).values({
      id: rid("stripe_event"),
      providerEventId: input.eventId,
      eventType: input.eventType,
      checkoutSessionId: input.checkoutSessionId,
      orderId: input.orderId || "",
      status: "processing",
      receivedAt: now,
    });
    return { claimed: true as const };
  } catch (error) {
    // A concurrent duplicate can win the unique-index race after the initial read.
    const duplicate = await db
      .select({ id: stripeWebhookEvents.id })
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.providerEventId, input.eventId))
      .limit(1);
    if (duplicate[0]) return { claimed: false as const };
    throw error;
  }
}

export async function finishStripeWebhookEvent(
  eventId: string,
  status: "fulfilled" | "ignored" | "failed",
  lastError = "",
) {
  await db
    .update(stripeWebhookEvents)
    .set({ status, lastError, processedAt: new Date().toISOString() })
    .where(eq(stripeWebhookEvents.providerEventId, eventId));
}

export async function failStripeWebhookEvent(eventId: string, error: unknown) {
  await finishStripeWebhookEvent(eventId, "failed", errorMessage(error));
}

async function ensureOrderDelivery(orderId: string) {
  await db
    .insert(orderDeliveries)
    .values({ id: rid("delivery"), orderId, status: "pending" })
    .onConflictDoNothing();
  const rows = await db
    .select()
    .from(orderDeliveries)
    .where(eq(orderDeliveries.orderId, orderId))
    .limit(1);
  return rows[0];
}

async function deliverOrder(orderId: string, email: string, downloadToken: string) {
  const delivery = await ensureOrderDelivery(orderId);
  if (!delivery || delivery.status === "sent") return "sent" as const;

  const now = new Date().toISOString();
  try {
    await sendDeliveryEmail(email, orderId, downloadToken);
    await db
      .update(orderDeliveries)
      .set({
        status: "sent",
        attempts: delivery.attempts + 1,
        lastError: "",
        sentAt: now,
        updatedAt: now,
      })
      .where(eq(orderDeliveries.orderId, orderId));
    return "sent" as const;
  } catch (error) {
    await db
      .update(orderDeliveries)
      .set({
        status: "failed",
        attempts: delivery.attempts + 1,
        lastError: errorMessage(error),
        updatedAt: now,
      })
      .where(eq(orderDeliveries.orderId, orderId));
    return "failed" as const;
  }
}

/**
 * The one fulfillment path shared by Stripe webhooks and the return-to-site
 * confirmation endpoint. It trusts a Stripe Checkout Session only when it
 * matches the locally recorded session ID for the order.
 */
export async function fulfillPaidStripeOrder(input: {
  checkoutSessionId: string;
  orderId?: string;
}): Promise<StripeFulfillmentResult> {
  const sessionOrder = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, input.checkoutSessionId))
    .limit(1);
  const initial = sessionOrder[0];
  if (!initial) return { status: "not_found" };
  if (input.orderId && initial.id !== input.orderId) return { status: "session_mismatch" };
  if (initial.status === "cancelled") return { status: "cancelled" };

  let justFulfilled = false;
  const order = await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, initial.id), eq(orders.stripeSessionId, input.checkoutSessionId)))
      .limit(1);
    const current = rows[0];
    if (!current) return null;
    if (current.status === "cancelled") return current;

    if (current.status !== "paid") {
      await tx
        .update(orders)
        .set({ status: "paid", paidAt: new Date().toISOString() })
        .where(eq(orders.id, current.id));
      justFulfilled = true;
    }

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, current.id));
    for (const item of items) {
      if (item.licenseTier === "exclusive") {
        await tx
          .update(beats)
          .set({ soldExclusive: true, published: false, featured: false })
          .where(eq(beats.id, item.beatId));
      }
    }
    return { ...current, status: "paid" };
  });

  if (!order) return { status: "not_found" };
  if (order.status === "cancelled") return { status: "cancelled" };

  if (order.customerId) await activateOrderEntitlements(order.customerId, order.id);
  const delivery = await deliverOrder(order.id, order.email, order.downloadToken);
  return { status: justFulfilled ? "fulfilled" : "already_paid", orderId: order.id, delivery };
}
