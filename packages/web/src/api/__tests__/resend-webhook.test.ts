import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";

const dbDir = mkdtempSync(join(tmpdir(), "vylanous-resend-webhook-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";
process.env.RESEND_WEBHOOK_SECRET = `whsec_${Buffer.from("vylanous-resend-webhook-test-secret").toString("base64")}`;

const [{ default: app }, { db }, { inboundEmails, emailEvents }] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
]);

describe("Resend webhook", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("accepts a signed inbound event and ignores a replay", async () => {
    const eventId = `msg_${randomUUID().replaceAll("-", "")}`;
    const emailId = randomUUID();
    const payload = JSON.stringify({
      type: "email.received",
      created_at: "2026-08-13T11:00:00.000Z",
      data: {
        email_id: emailId,
        from: "fan@example.com",
        to: ["contact@example.com"],
        subject: "Booking inquiry",
        created_at: "2026-08-13T11:00:00.000Z",
      },
    });
    const timestamp = new Date();
    const signature = new Webhook(process.env.RESEND_WEBHOOK_SECRET!).sign(
      eventId,
      timestamp,
      payload,
    );

    const request = () =>
      app.request("/api/webhooks/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "svix-id": eventId,
          "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
          "svix-signature": signature,
        },
        body: payload,
      });

    expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(200);

    const messages = await db.select().from(inboundEmails).where(eq(inboundEmails.id, emailId));
    const events = await db
      .select()
      .from(emailEvents)
      .where(eq(emailEvents.providerEventId, eventId));
    expect(messages).toHaveLength(1);
    expect(messages[0].subject).toBe("Booking inquiry");
    expect(events).toHaveLength(1);
  });
});
