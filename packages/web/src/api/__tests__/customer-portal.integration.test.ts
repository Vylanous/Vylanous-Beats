import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dbDir = mkdtempSync(join(tmpdir(), "vylanous-customer-portal-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;

const [{ default: app }, { db }, { beats }] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
]);

async function seedBeat(featured: boolean) {
  const id = `beat_${randomUUID().slice(0, 8)}`;
  const slug = `${featured ? "featured" : "private"}-${randomUUID().slice(0, 8)}`;
  await db.insert(beats).values({
    id,
    slug,
    title: featured ? "Featured Discovery" : "Customer Vault Beat",
    bpm: 90,
    musicalKey: "Fm",
    genre: "Hip-Hop",
    mood: "Focused",
    tags: "test",
    artworkUrl: "artwork/test.png",
    audioUrl: "audio/test.mp3",
    fileUrls: JSON.stringify({ free: "https://downloads.example.test/free-test.mp3" }),
    priceFrom: 0,
    featured,
    published: true,
  });
  return { id, slug };
}

describe("shared customer portal", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("keeps featured discovery public while requiring an account for the catalog, checkout, entitlements, and downloads", async () => {
    const featured = await seedBeat(true);
    const privateBeat = await seedBeat(false);
    expect((await app.request("/api/beats/featured")).status).toBe(200);
    expect((await app.request("/api/beats")).status).toBe(401);
    expect((await app.request(`/api/beats/${privateBeat.slug}`)).status).toBe(401);
    expect((await app.request(`/api/beats/${featured.slug}`)).status).toBe(200);

    const email = `customer-${randomUUID().slice(0, 8)}@example.com`;
    const registration = await app.request("/api/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "customer-test-password",
        displayName: "Portal Buyer",
      }),
    });
    expect(registration.status).toBe(201);
    const registered = (await registration.json()) as { session: { token: string } };
    const headers = {
      Authorization: `Bearer ${registered.session.token}`,
      "Content-Type": "application/json",
    };

    expect((await app.request("/api/beats", { headers })).status).toBe(200);
    const checkout = await app.request("/api/checkout", {
      method: "POST",
      headers,
      body: JSON.stringify({ items: [{ beatId: privateBeat.id, tier: "free" }] }),
    });
    expect(checkout.status).toBe(200);

    const dashboard = await app.request("/api/customer/dashboard", { headers });
    expect(dashboard.status).toBe(200);
    const portal = (await dashboard.json()) as {
      insights: { licensesOwned: number };
      entitlements: { id: string }[];
    };
    expect(portal.insights.licensesOwned).toBe(1);
    expect(portal.entitlements).toHaveLength(1);
    expect(
      (
        await app.request(`/api/customer/entitlements/${portal.entitlements[0].id}/download`, {
          headers,
        })
      ).status,
    ).toBe(200);

    const second = await app.request("/api/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `other-${randomUUID().slice(0, 8)}@example.com`,
        password: "customer-test-password",
      }),
    });
    const other = (await second.json()) as { session: { token: string } };
    expect(
      (
        await app.request(`/api/customer/entitlements/${portal.entitlements[0].id}/download`, {
          headers: { Authorization: `Bearer ${other.session.token}` },
        })
      ).status,
    ).toBe(404);
  });
});
