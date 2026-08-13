import { desc, eq } from "drizzle-orm";
import type { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../database";
import { emailEvents, inboundEmails } from "../database/schema";
import { requireAdmin } from "../lib/admin-auth";
import { sendSafeTestEmail } from "../lib/email";

export function adminEmailRoutes(app: Hono) {
  app.get("/admin/inbox", requireAdmin, async (c) => {
    const messages = await db
      .select()
      .from(inboundEmails)
      .orderBy(desc(inboundEmails.receivedAt))
      .limit(100);
    const events = await db
      .select()
      .from(emailEvents)
      .orderBy(desc(emailEvents.receivedAt))
      .limit(100);
    return c.json(
      {
        messages: messages.map((message) => ({
          ...message,
          to: parseEmailRecipients(message.toJson),
        })),
        events,
      },
      200,
    );
  });

  app.patch(
    "/admin/inbox/:id",
    requireAdmin,
    zValidator("json", z.object({ status: z.enum(["unread", "read", "archived"]) })),
    async (c) => {
      const id = c.req.param("id");
      if (!id) return c.json({ error: "invalid_inbox_message_id" }, 400);
      await db
        .update(inboundEmails)
        .set({ status: c.req.valid("json").status })
        .where(eq(inboundEmails.id, id));
      return c.json({ ok: true }, 200);
    },
  );

  app.get("/admin/inbox/:id/content", requireAdmin, async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "invalid_inbox_message_id" }, 400);
    const rows = await db.select().from(inboundEmails).where(eq(inboundEmails.id, id)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return c.json({ error: "resend_not_configured" }, 503);

    const response = await fetch(`https://api.resend.com/emails/receiving/${rows[0].id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) return c.json({ error: "received_email_unavailable" }, 502);
    const content = (await response.json()) as { text?: string | null; html?: string | null };
    await db.update(inboundEmails).set({ status: "read" }).where(eq(inboundEmails.id, rows[0].id));
    return c.json({ text: content.text || stripEmailHtml(content.html || "") }, 200);
  });

  app.post("/admin/email/test", requireAdmin, async (c) => {
    try {
      const result = await sendSafeTestEmail();
      return c.json({ ok: true, providerEmailId: result.id || null }, 200);
    } catch (error) {
      return c.json(
        {
          error: "email_test_failed",
          message: error instanceof Error ? error.message : "Email test failed",
        },
        503,
      );
    }
  });
}

function parseEmailRecipients(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function stripEmailHtml(value: string) {
  return value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
