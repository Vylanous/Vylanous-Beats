import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dbDir = mkdtempSync(join(tmpdir(), "vylanous-rate-limit-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";

const [{ default: app }, { db }, { rateLimitWindows }] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
]);

const requestHeaders = {
  "Content-Type": "application/json",
  "cf-connecting-ip": "203.0.113.11",
};

describe("application rate limits", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("caps newsletter requests, provides retry metadata, and retains only a derived identifier", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await app.request("/api/subscribe", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({ email: `fan${attempt}@example.com` }),
      });
      expect(response.status).toBe(200);
    }

    const blocked = await app.request("/api/subscribe", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({ email: "limited@example.com" }),
    });

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(blocked.headers.get("RateLimit-Limit")).toBe("5");
    expect(blocked.headers.get("RateLimit-Remaining")).toBe("0");
    await expect(blocked.json()).resolves.toMatchObject({ error: "rate_limited" });

    const windows = await db.select().from(rateLimitWindows);
    const newsletterWindow = windows.find((window) => window.scope === "newsletter-subscribe");
    expect(newsletterWindow).toMatchObject({ hits: 5 });
    expect(newsletterWindow?.subjectHash).not.toContain("203.0.113.11");
  });

  test("keeps rate-limit subjects and route scopes separate", async () => {
    const anotherVisitor = await app.request("/api/subscribe", {
      method: "POST",
      headers: { ...requestHeaders, "cf-connecting-ip": "203.0.113.12" },
      body: JSON.stringify({ email: "another-visitor@example.com" }),
    });
    const adminLogin = await app.request("/api/admin/login", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({ password: "wrong-password" }),
    });

    expect(anotherVisitor.status).toBe(200);
    expect(adminLogin.status).toBe(401);
  });

  test("documents the Stripe signing secret and required webhook event configuration", () => {
    const envTemplatePath = fileURLToPath(new URL("../../../../../.env.template", import.meta.url));
    const envTemplate = readFileSync(envTemplatePath, "utf8");

    expect(envTemplate).toContain("STRIPE_WEBHOOK_SECRET=");
    expect(envTemplate).toContain("https://www.vylanous.com/api/webhooks/stripe");
    expect(envTemplate).toContain("checkout.session.completed");
    expect(envTemplate).toContain("checkout.session.async_payment_succeeded");
  });
});
