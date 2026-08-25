import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dbDir = mkdtempSync(join(tmpdir(), "vylanous-published-retention-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";

const [{ default: app }, { db }, { publishedBeatBlockMetrics, publishedBeatBlockMonthlyMetrics }] =
  await Promise.all([import("../index"), import("../database"), import("../database/schema")]);

describe("Published Beats analytics retention", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("rolls daily interactions older than 90 days into monthly totals", async () => {
    await db.insert(publishedBeatBlockMetrics).values({
      id: "old-daily-interaction",
      pageId: "page_home",
      blockId: "block_featured",
      beatId: "beat_one",
      eventType: "card_click",
      day: "2026-01-15",
      count: 7,
    });
    const login = await app.request("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "integration-test-password" }),
    });
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    const result = await app.request("/api/admin/published-beat-analytics/rollup", {
      method: "POST",
      headers: { Cookie: cookie },
    });

    expect(result.status).toBe(200);
    expect(await db.select().from(publishedBeatBlockMetrics)).toHaveLength(0);
    expect(await db.select().from(publishedBeatBlockMonthlyMetrics)).toMatchObject([
      { month: "2026-01", count: 7, eventType: "card_click" },
    ]);
  });
});
