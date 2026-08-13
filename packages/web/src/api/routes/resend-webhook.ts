import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { emailEvents, inboundEmails } from "../database/schema";
import { rid } from "../lib/util";

interface ResendEvent {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    created_at?: string;
  };
}

export function resendWebhookRoutes(app: Hono) {
  app.post("/webhooks/resend", async (c) => {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) return c.json({ error: "webhook_not_configured" }, 503);

    const rawPayload = await c.req.text();
    const eventId = c.req.header("svix-id");
    const timestamp = c.req.header("svix-timestamp");
    const signature = c.req.header("svix-signature");
    if (!eventId || !timestamp || !signature) return c.json({ error: "missing_signature" }, 400);

    let event: ResendEvent;
    try {
      event = new Webhook(secret).verify(rawPayload, {
        "svix-id": eventId,
        "svix-timestamp": timestamp,
        "svix-signature": signature,
      }) as ResendEvent;
    } catch {
      return c.json({ error: "invalid_signature" }, 401);
    }

    const existing = await db
      .select({ id: emailEvents.id })
      .from(emailEvents)
      .where(eq(emailEvents.providerEventId, eventId))
      .limit(1);
    if (existing.length > 0) return c.json({ ok: true, duplicate: true }, 200);

    const providerEmailId = event.data?.email_id || "";
    await db.insert(emailEvents).values({
      id: rid("email_event"),
      providerEventId: eventId,
      providerEmailId,
      eventType: event.type || "unknown",
      payloadJson: rawPayload,
      receivedAt: event.created_at || new Date().toISOString(),
    });

    if (event.type === "email.received" && providerEmailId) {
      const existingInbound = await db
        .select({ id: inboundEmails.id })
        .from(inboundEmails)
        .where(eq(inboundEmails.id, providerEmailId))
        .limit(1);
      if (existingInbound.length === 0) {
        await db.insert(inboundEmails).values({
          id: providerEmailId,
          providerEventId: eventId,
          fromAddress: event.data?.from || "",
          toJson: JSON.stringify(event.data?.to || []),
          subject: event.data?.subject || "(no subject)",
          receivedAt: event.data?.created_at || event.created_at || new Date().toISOString(),
        });
      }
    }

    return c.json({ ok: true }, 200);
  });
}
