import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dbDir = mkdtempSync(join(tmpdir(), "vylanous-health-readiness-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";
process.env.APP_URL = "https://www.vylanous.com";
process.env.RESEND_API_KEY = "test-resend-key";
process.env.EMAIL_FROM = "Vylanous Beats <no-reply@vylanous.com>";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

const { default: app } = await import("../index");

describe("health diagnostics", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("separates liveness from database-backed readiness without exposing secrets", async () => {
    const live = await app.request("/api/health/live");
    expect(live.status).toBe(200);
    expect(await live.json()).toEqual({ status: "ok" });

    const readiness = await app.request("/api/health/ready");
    const payload = (await readiness.json()) as {
      status: string;
      checks: Record<string, boolean>;
    };
    expect(payload.checks.databaseReady).toBe(true);
    expect(payload.checks.stripeWebhookConfigured).toBe(true);
    expect(JSON.stringify(payload)).not.toContain("whsec_test");
  });
});
