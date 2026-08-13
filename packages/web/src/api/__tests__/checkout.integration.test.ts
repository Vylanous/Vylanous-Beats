import { describe, expect, test, beforeAll } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";

// Set env BEFORE importing the app / db so the temp DB is used.
const dbDir = mkdtempSync(join(tmpdir(), "vylanous-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";
process.env.STRIPE_SECRET_KEY = "";
process.env.RESEND_API_KEY = "test-resend-key";
process.env.EMAIL_FROM = "Vylanous Beats <onboarding@resend.dev>";
process.env.APP_URL = "";

// Free checkouts send a delivery email. Keep this integration test offline and
// assert the checkout behavior without depending on Resend.
globalThis.fetch = (async () => new Response(null, { status: 202 })) as typeof fetch;

const [{ default: app }, { db }, { beats }, { orders, orderItems }] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
  import("../database/schema"),
]);

async function seedBeat(overrides: Record<string, unknown> = {}) {
  const id = `beat_${randomUUID().slice(0, 8)}`;
  const row = {
    id,
    title: "Test Beat",
    slug: `test-beat-${randomUUID().slice(0, 6)}`,
    bpm: 90,
    musicalKey: "C#m",
    genre: "Hip-Hop",
    mood: "Dark",
    tags: "",
    artworkUrl: "https://cdn.example.com/art.png",
    audioUrl: "https://cdn.example.com/preview.mp3",
    fileUrls: JSON.stringify({
      free: "https://cdn.example.com/free.mp3",
      mp3: "https://cdn.example.com/mp3.mp3",
    }),
    priceFrom: 2400,
    soldExclusive: false,
    featured: false,
    published: true,
    ...overrides,
  };
  await db.insert(beats).values(row as never);
  return row;
}

async function checkout(email: string, items: { beatId: string; tier: string }[]) {
  return app.request("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: "Test User", items }),
  });
}

describe("checkout", () => {
  beforeAll(async () => {
    // wait for the app's seed to settle against the temp db
    await new Promise((r) => setTimeout(r, 50));
  });

  test("free-tier item creates a paid order atomically", async () => {
    const beat = await seedBeat();
    const res = await checkout("customer@example.com", [{ beatId: beat.id, tier: "free" }]);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("free");
    expect(body.orderId).toBeTruthy();
    expect(body.token).toBeTruthy();

    const orderRows = await db.select().from(orders).where(eq(orders.id, body.orderId));
    expect(orderRows.length).toBe(1);
    expect(orderRows[0].status).toBe("paid");
    expect(orderRows[0].totalCents).toBe(0);

    const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, body.orderId));
    expect(itemRows.length).toBe(1);
    expect(itemRows[0].licenseTier).toBe("free");
  });

  test("sold-exclusive beat is rejected with 409", async () => {
    const beat = await seedBeat({ soldExclusive: true });
    const res = await checkout("buyer@example.com", [{ beatId: beat.id, tier: "exclusive" }]);
    expect(res.status).toBe(409);
  });
});
