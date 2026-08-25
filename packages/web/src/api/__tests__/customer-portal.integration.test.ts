import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dbDir = mkdtempSync(join(tmpdir(), "vylanous-customer-portal-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;

const [{ default: app }, { db }, { beats }, { createCustomerVerificationToken }] =
  await Promise.all([
    import("../index"),
    import("../database"),
    import("../database/schema"),
    import("../lib/customer-auth"),
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

  test("allows account holders to browse while requiring verification for checkout and downloads", async () => {
    const featured = await seedBeat(true);
    const privateBeat = await seedBeat(false);
    const publicFeatured = await app.request("/api/beats/featured");
    expect(publicFeatured.status).toBe(200);
    const featuredPayload = (await publicFeatured.json()) as { beats: { id: string }[] };
    expect(featuredPayload.beats.map((beat) => beat.id)).toContain(featured.id);
    expect(featuredPayload.beats.map((beat) => beat.id)).not.toContain(privateBeat.id);
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
    const registered = (await registration.json()) as {
      customer: { id: string; emailVerified: boolean };
      session: { token: string };
    };
    expect(registered.customer.emailVerified).toBe(false);
    const resend = await app.request("/api/customer/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    expect(resend.status).toBe(202);
    const unverifiedHeaders = { Authorization: `Bearer ${registered.session.token}` };
    expect((await app.request("/api/beats", { headers: unverifiedHeaders })).status).toBe(200);
    expect(
      (await app.request(`/api/beats/${privateBeat.slug}`, { headers: unverifiedHeaders })).status,
    ).toBe(200);
    const unverifiedCheckout = await app.request("/api/checkout", {
      method: "POST",
      headers: { ...unverifiedHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ beatId: privateBeat.id, tier: "free" }],
        idempotencyKey: "customer-portal-unverified-checkout-key",
      }),
    });
    expect(unverifiedCheckout.status).toBe(403);
    const verification = await createCustomerVerificationToken(registered.customer.id);
    const verified = await app.request("/api/customer/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verification.token }),
    });
    expect(verified.status).toBe(200);
    const browserVerification = await createCustomerVerificationToken(registered.customer.id);
    const browserRedirect = await app.request(
      `/api/customer/verify-email?token=${encodeURIComponent(browserVerification.token)}`,
      { redirect: "manual" },
    );
    expect(browserRedirect.status).toBe(302);
    expect(browserRedirect.headers.get("location")).toContain("/verify-email?status=success");
    const replay = await app.request("/api/customer/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verification.token }),
    });
    expect(replay.status).toBe(400);
    const headers = {
      Authorization: `Bearer ${registered.session.token}`,
      "Content-Type": "application/json",
    };

    expect((await app.request("/api/beats", { headers })).status).toBe(200);
    const checkout = await app.request("/api/checkout", {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: [{ beatId: privateBeat.id, tier: "free" }],
        idempotencyKey: "customer-portal-verified-checkout-key",
      }),
    });
    expect(checkout.status).toBe(200);

    const dashboard = await app.request("/api/customer/dashboard", { headers });
    expect(dashboard.status).toBe(200);
    const portal = (await dashboard.json()) as {
      insights: { licensesOwned: number };
      entitlements: { id: string; downloadUrl?: string }[];
    };
    expect(portal.insights.licensesOwned).toBe(1);
    expect(portal.entitlements).toHaveLength(1);
    expect(portal.entitlements[0].downloadUrl).toBeUndefined();
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
    const other = (await second.json()) as {
      customer: { id: string };
      session: { token: string };
    };
    const otherVerification = await createCustomerVerificationToken(other.customer.id);
    const otherVerified = await app.request("/api/customer/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: otherVerification.token }),
    });
    expect(otherVerified.status).toBe(200);
    expect(
      (
        await app.request(`/api/customer/entitlements/${portal.entitlements[0].id}/download`, {
          headers: { Authorization: `Bearer ${other.session.token}` },
        })
      ).status,
    ).toBe(404);
  });
});
