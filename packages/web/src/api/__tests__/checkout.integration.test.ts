import { describe, expect, test, beforeAll } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Set env BEFORE importing the app / db so the temp DB is used.
const dbDir = mkdtempSync(join(tmpdir(), "vylanous-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";
process.env.STRIPE_SECRET_KEY = "";
process.env.RESEND_API_KEY = "";
process.env.APP_URL = "";

const [{ default: app }, { db }, { beats }] = await Promise.all([
  import("../index"),
  import("../database"),
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
    fileUrls: JSON.stringify({ free: "https://cdn.example.com/free.mp3", mp3: "https://cdn.example.com/mp3.mp3" }),
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

    const orderRows = await db
      .select()
      .from(beats)
      .where((b) => b.id === body.orderId);
    void orderRows;

    const { orders, orderItems } = await import("../database/schema");
    const orderRows2 = await db.select().from(orders).where((o) => o.id === body.orderId);
    expect(orderRows2.length).toBe(1);
    expect(orderRows2[0].status).toBe("paid");
    expect(orderRows2[0].totalCents).toBe(0);

    const itemRows = await db.select().from(orderItems).where((i) => i.orderId === body.orderId);
    expect(itemRows.length).toBe(1);
    expect(itemRows[0].licenseTier).toBe("free");
  });

  test("sold-exclusive beat is rejected with 409", async () => {
    const beat = await seedBeat({ soldExclusive: true });
    const res = await checkout("buyer@example.com", [{ beatId: beat.id, tier: "exclusive" }]);
    expect(res.status).toBe(409);
  });
});
