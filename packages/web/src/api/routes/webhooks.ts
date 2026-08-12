import type { Hono } from "hono";
import { stripe } from "../lib/stripe";
import { fulfillOrder } from "../lib/fulfill";

/**
 * Stripe webhook. Without it an order only gets confirmed when the buyer lands
 * back on /success — close the tab after paying and the beats never arrive.
 *
 * Requires STRIPE_WEBHOOK_SECRET (Stripe dashboard → Developers → Webhooks,
 * endpoint https://<domain>/api/webhooks/stripe, event checkout.session.completed).
 */
export function webhookRoutes(app: Hono) {
  app.post("/webhooks/stripe", async (c) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) {
      console.error("[webhook] stripe webhook hit but STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET missing");
      return c.json({ error: "webhook_not_configured" }, 503);
    }

    const signature = c.req.header("stripe-signature");
    if (!signature) return c.json({ error: "missing_signature" }, 400);

    const raw = await c.req.text();
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(raw, signature, secret);
    } catch (e) {
      console.error("[webhook] signature verification failed", e);
      return c.json({ error: "invalid_signature" }, 400);
    }

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as { metadata?: Record<string, string> | null; payment_status?: string };
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        console.error("[webhook] session without orderId metadata", event.id);
        return c.json({ received: true }, 200);
      }
      if (session.payment_status && session.payment_status !== "paid") {
        return c.json({ received: true, skipped: session.payment_status }, 200);
      }
      const result = await fulfillOrder(orderId);
      console.log("[webhook] fulfill", { orderId, result });
    }

    return c.json({ received: true }, 200);
  });
}
