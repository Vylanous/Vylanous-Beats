import { eq } from "drizzle-orm";
import { db } from "../database";
import { orders, orderItems, beats } from "../database/schema";
import { sendDeliveryEmail } from "./email";

/**
 * Mark an order paid, flag exclusives as sold, and email the download link.
 * Idempotent: an order already marked `paid` is a no-op, so the Stripe webhook
 * and the /success confirm call can both run without double-sending email.
 */
export async function fulfillOrder(orderId: string): Promise<"fulfilled" | "already_paid" | "not_found"> {
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (rows.length === 0) return "not_found";
  const order = rows[0];
  if (order.status === "paid") return "already_paid";

  await db
    .update(orders)
    .set({ status: "paid", paidAt: new Date().toISOString() })
    .where(eq(orders.id, orderId));

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const it of items) {
    if (it.licenseTier === "exclusive") {
      await db.update(beats).set({ soldExclusive: true, published: false }).where(eq(beats.id, it.beatId));
    }
  }

  await sendDeliveryEmail(order.email, orderId, order.downloadToken).catch((e) =>
    console.error("[email] delivery failed", { orderId, error: e }),
  );

  return "fulfilled";
}
