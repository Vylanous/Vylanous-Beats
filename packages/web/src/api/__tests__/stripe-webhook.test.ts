import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";

const dbDir = mkdtempSync(join(tmpdir(), "vylanous-stripe-webhook-"));
const webhookSecret = "whsec_stripe_webhook_test_secret";
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";
process.env.STRIPE_SECRET_KEY = "sk_test_stripe_webhook_test_key";
process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
process.env.RESEND_API_KEY = "test-resend-key";
process.env.EMAIL_FROM = "Vylanous Beats <onboarding@resend.dev>";
process.env.APP_URL = "https://www.vylanous.com";

const deliveryRequests: RequestInit[] = [];
let failNextDelivery = false;
globalThis.fetch = (async (_input, init) => {
  deliveryRequests.push(init || {});
  if (failNextDelivery) {
    failNextDelivery = false;
    return new Response("temporary delivery outage", { status: 503 });
  }
  return new Response(JSON.stringify({ id: "email_test" }), { status: 200 });
}) as typeof fetch;

const [
  { default: app },
  { db },
  {
    beats,
    customers,
    customerEntitlements,
    orderDeliveries,
    orderItems,
    orders,
    stripeWebhookEvents,
  },
  { stripe },
  { fulfillPaidStripeOrder },
  { createCustomerVerificationToken },
] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
  import("../lib/stripe"),
  import("../lib/order-fulfillment"),
  import("../lib/customer-auth"),
]);

function stripeEvent(input: {
  eventId: string;
  sessionId: string;
  orderId: string;
  paymentStatus?: "paid" | "unpaid";
  type?: "checkout.session.completed" | "checkout.session.async_payment_succeeded";
}) {
  return JSON.stringify({
    id: input.eventId,
    object: "event",
    type: input.type || "checkout.session.completed",
    data: {
      object: {
        id: input.sessionId,
        object: "checkout.session",
        payment_status: input.paymentStatus || "paid",
        metadata: { orderId: input.orderId },
      },
    },
  });
}

async function signedWebhook(payload: string) {
  const signature = await stripe!.webhooks.generateTestHeaderStringAsync({
    payload,
    secret: webhookSecret,
  });
  return app.request("/api/webhooks/stripe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": signature },
    body: payload,
  });
}

async function seedPendingOrder(exclusive = false) {
  const suffix = randomUUID().slice(0, 8);
  const customerId = `customer_${suffix}`;
  const orderId = `order_${suffix}`;
  const sessionId = `cs_test_${suffix}`;
  const beatId = `beat_${suffix}`;
  await db.insert(customers).values({
    id: customerId,
    email: `${suffix}@example.com`,
    displayName: "Webhook Customer",
    passwordHash: "not-used-in-this-test",
    emailVerified: true,
  });
  await db.insert(beats).values({
    id: beatId,
    title: "Webhook Beat",
    slug: `webhook-beat-${suffix}`,
    bpm: 90,
    musicalKey: "C#m",
    genre: "Hip-Hop",
    mood: "Dark",
    tags: "",
    artworkUrl: "https://cdn.example.com/art.jpg",
    audioUrl: "https://cdn.example.com/preview.mp3",
    fileUrls: JSON.stringify({ mp3: "https://cdn.example.com/file.mp3" }),
    priceFrom: 2400,
    soldExclusive: false,
    featured: true,
    published: true,
  });
  await db.insert(orders).values({
    id: orderId,
    customerId,
    email: `${suffix}@example.com`,
    name: "Webhook Customer",
    status: "pending",
    totalCents: 2400,
    currency: "cad",
    stripeSessionId: sessionId,
    downloadToken: `token_${suffix}`,
  });
  await db.insert(orderItems).values({
    id: `item_${suffix}`,
    orderId,
    beatId,
    beatTitle: "Webhook Beat",
    licenseTier: exclusive ? "exclusive" : "mp3",
    licenseName: exclusive ? "Exclusive" : "MP3 Lease",
    priceCents: 2400,
    fileUrl: "https://cdn.example.com/file.mp3",
  });
  return { beatId, customerId, orderId, sessionId };
}

async function registerVerifiedCustomer(email: string) {
  const registration = await app.request("/api/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "customer-test-password",
      displayName: "Checkout Simulation",
    }),
  });
  expect(registration.status).toBe(201);
  const account = (await registration.json()) as {
    customer: { id: string };
    session: { token: string };
  };
  const verification = await createCustomerVerificationToken(account.customer.id);
  const verified = await app.request("/api/customer/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: verification.token }),
  });
  expect(verified.status).toBe(200);
  return account;
}

describe("Stripe Checkout webhook", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("fulfills a signed paid Checkout Session exactly once", async () => {
    const seeded = await seedPendingOrder(true);
    const payload = stripeEvent({
      eventId: `evt_${randomUUID().replaceAll("-", "")}`,
      sessionId: seeded.sessionId,
      orderId: seeded.orderId,
    });
    const beforeDeliveries = deliveryRequests.length;

    expect((await signedWebhook(payload)).status).toBe(200);
    expect((await signedWebhook(payload)).status).toBe(200);

    const order = await db.select().from(orders).where(eq(orders.id, seeded.orderId));
    const beat = await db.select().from(beats).where(eq(beats.id, seeded.beatId));
    const entitlements = await db
      .select()
      .from(customerEntitlements)
      .where(eq(customerEntitlements.customerId, seeded.customerId));
    const deliveries = await db
      .select()
      .from(orderDeliveries)
      .where(eq(orderDeliveries.orderId, seeded.orderId));
    const events = await db
      .select()
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.checkoutSessionId, seeded.sessionId));

    expect(order[0].status).toBe("paid");
    expect(beat[0]).toMatchObject({ soldExclusive: true, published: false, featured: false });
    expect(entitlements).toHaveLength(1);
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]).toMatchObject({ status: "sent", attempts: 1 });
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe("fulfilled");
    expect(deliveryRequests).toHaveLength(beforeDeliveries + 1);
    expect(new Headers(deliveryRequests.at(-1)?.headers).get("Idempotency-Key")).toBe(
      `beat-delivery/${seeded.orderId}`,
    );

    const fallback = await fulfillPaidStripeOrder({
      checkoutSessionId: seeded.sessionId,
      orderId: seeded.orderId,
    });
    expect(fallback).toMatchObject({ status: "already_paid", delivery: "sent" });
    expect(deliveryRequests).toHaveLength(beforeDeliveries + 1);
  });

  test("rejects a bad signature without persisting an event", async () => {
    const seeded = await seedPendingOrder();
    const payload = stripeEvent({
      eventId: `evt_${randomUUID().replaceAll("-", "")}`,
      sessionId: seeded.sessionId,
      orderId: seeded.orderId,
    });
    const response = await app.request("/api/webhooks/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": "invalid" },
      body: payload,
    });
    expect(response.status).toBe(400);
    const events = await db
      .select()
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.checkoutSessionId, seeded.sessionId));
    expect(events).toHaveLength(0);
  });

  test("does not fulfill unpaid or mismatched sessions", async () => {
    const unpaid = await seedPendingOrder();
    const unpaidPayload = stripeEvent({
      eventId: `evt_${randomUUID().replaceAll("-", "")}`,
      sessionId: unpaid.sessionId,
      orderId: unpaid.orderId,
      paymentStatus: "unpaid",
    });
    expect((await signedWebhook(unpaidPayload)).status).toBe(200);

    const mismatch = await seedPendingOrder();
    const mismatchPayload = stripeEvent({
      eventId: `evt_${randomUUID().replaceAll("-", "")}`,
      sessionId: mismatch.sessionId,
      orderId: "order_not_the_session_owner",
    });
    expect((await signedWebhook(mismatchPayload)).status).toBe(200);

    const [unpaidOrder] = await db.select().from(orders).where(eq(orders.id, unpaid.orderId));
    const [mismatchOrder] = await db.select().from(orders).where(eq(orders.id, mismatch.orderId));
    expect(unpaidOrder.status).toBe("pending");
    expect(mismatchOrder.status).toBe("pending");
  });

  test("retries a transient delivery failure without reprocessing payment access", async () => {
    const seeded = await seedPendingOrder();
    const payload = stripeEvent({
      eventId: `evt_${randomUUID().replaceAll("-", "")}`,
      sessionId: seeded.sessionId,
      orderId: seeded.orderId,
      type: "checkout.session.async_payment_succeeded",
    });
    failNextDelivery = true;

    expect((await signedWebhook(payload)).status).toBe(500);
    const [failedEvent] = await db
      .select()
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.checkoutSessionId, seeded.sessionId));
    const [failedDelivery] = await db
      .select()
      .from(orderDeliveries)
      .where(eq(orderDeliveries.orderId, seeded.orderId));
    expect(failedEvent.status).toBe("failed");
    expect(failedDelivery).toMatchObject({ status: "failed", attempts: 1 });

    expect((await signedWebhook(payload)).status).toBe(200);
    const [paidOrder] = await db.select().from(orders).where(eq(orders.id, seeded.orderId));
    const [sentDelivery] = await db
      .select()
      .from(orderDeliveries)
      .where(eq(orderDeliveries.orderId, seeded.orderId));
    const entitlements = await db
      .select()
      .from(customerEntitlements)
      .where(eq(customerEntitlements.customerId, seeded.customerId));
    expect(paidOrder.status).toBe("paid");
    expect(sentDelivery).toMatchObject({ status: "sent", attempts: 2 });
    expect(entitlements).toHaveLength(1);
  });

  test("runs an isolated paid checkout followed by a signed webhook event", async () => {
    const suffix = randomUUID().slice(0, 8);
    const sessionId = `cs_test_checkout_${suffix}`;
    const beat = await seedPendingOrder();
    // The seeded pending order is not used in this checkout simulation; reuse its
    // beat and remove its placeholder order data so this test goes through the
    // public checkout route to create a fresh pending order.
    await db.delete(orderItems).where(eq(orderItems.orderId, beat.orderId));
    await db.delete(orders).where(eq(orders.id, beat.orderId));
    await db.delete(customers).where(eq(customers.id, beat.customerId));

    const account = await registerVerifiedCustomer(`checkout-${suffix}@example.com`);
    const originalCreate = stripe!.checkout.sessions.create;
    (stripe!.checkout.sessions.create as unknown as (input: unknown) => Promise<unknown>) =
      async () => ({
        id: sessionId,
        url: `https://checkout.stripe.test/session/${sessionId}`,
      });

    try {
      const checkout = await app.request("/api/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: [{ beatId: beat.beatId, tier: "mp3" }] }),
      });
      expect(checkout.status).toBe(200);
      const body = (await checkout.json()) as { mode: string; orderId: string; url: string | null };
      expect(body).toMatchObject({
        mode: "stripe",
        url: `https://checkout.stripe.test/session/${sessionId}`,
      });

      const [pendingOrder] = await db.select().from(orders).where(eq(orders.id, body.orderId));
      expect(pendingOrder).toMatchObject({
        customerId: account.customer.id,
        status: "pending",
        stripeSessionId: sessionId,
      });

      const beforeDeliveries = deliveryRequests.length;
      const event = stripeEvent({
        eventId: `evt_${randomUUID().replaceAll("-", "")}`,
        sessionId,
        orderId: body.orderId,
      });
      expect((await signedWebhook(event)).status).toBe(200);
      expect((await signedWebhook(event)).status).toBe(200);

      const [paidOrder] = await db.select().from(orders).where(eq(orders.id, body.orderId));
      const entitlements = await db
        .select()
        .from(customerEntitlements)
        .where(eq(customerEntitlements.customerId, account.customer.id));
      const deliveries = await db
        .select()
        .from(orderDeliveries)
        .where(eq(orderDeliveries.orderId, body.orderId));
      expect(paidOrder.status).toBe("paid");
      expect(entitlements).toHaveLength(1);
      expect(deliveries).toHaveLength(1);
      expect(deliveries[0]).toMatchObject({ status: "sent", attempts: 1 });
      expect(deliveryRequests).toHaveLength(beforeDeliveries + 1);
    } finally {
      stripe!.checkout.sessions.create = originalCreate;
    }
  });
});
