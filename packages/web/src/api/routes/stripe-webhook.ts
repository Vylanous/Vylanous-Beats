import type Stripe from "stripe";
import type { Hono } from "hono";
import {
  beginStripeWebhookEvent,
  failStripeWebhookEvent,
  finishStripeWebhookEvent,
  fulfillPaidStripeOrder,
} from "../lib/order-fulfillment";
import { stripe } from "../lib/stripe";

const PAYMENT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

/**
 * Stripe sends this route raw signed bytes. Do not add JSON parsing before
 * `constructEventAsync`, or signature verification will be invalidated.
 */
export function stripeWebhookRoutes(app: Hono) {
  app.post("/webhooks/stripe", async (c) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) return c.json({ error: "webhook_not_configured" }, 503);

    const signature = c.req.header("stripe-signature");
    if (!signature) return c.json({ error: "missing_signature" }, 400);

    const rawPayload = await c.req.text();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawPayload, signature, secret);
    } catch {
      return c.json({ error: "invalid_signature" }, 400);
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const checkoutSessionId = session.id || "";
    const orderId = session.metadata?.orderId || "";
    const claim = await beginStripeWebhookEvent({
      eventId: event.id,
      eventType: event.type,
      checkoutSessionId,
      orderId,
    });
    if (!claim.claimed) return c.json({ ok: true, duplicate: true }, 200);

    try {
      if (!PAYMENT_EVENTS.has(event.type)) {
        await finishStripeWebhookEvent(event.id, "ignored");
        return c.json({ ok: true, ignored: true }, 200);
      }
      if (!checkoutSessionId || session.payment_status !== "paid") {
        await finishStripeWebhookEvent(event.id, "ignored", "Checkout session is not paid.");
        return c.json({ ok: true, ignored: true }, 200);
      }

      const result = await fulfillPaidStripeOrder({ checkoutSessionId, orderId });
      if (
        result.status === "not_found" ||
        result.status === "session_mismatch" ||
        result.status === "cancelled"
      ) {
        await finishStripeWebhookEvent(event.id, "ignored", result.status);
        return c.json({ ok: true, ignored: true }, 200);
      }

      if (result.delivery === "failed") {
        const deliveryError = new Error("Delivery email failed; Stripe should retry this event.");
        await failStripeWebhookEvent(event.id, deliveryError);
        return c.json({ error: "delivery_pending" }, 500);
      }

      await finishStripeWebhookEvent(event.id, "fulfilled");
      return c.json({ ok: true, fulfillment: result.status, delivery: result.delivery }, 200);
    } catch (error) {
      await failStripeWebhookEvent(event.id, error);
      console.error("[stripe-webhook] processing failed", { eventId: event.id, error });
      return c.json({ error: "webhook_processing_failed" }, 500);
    }
  });
}
