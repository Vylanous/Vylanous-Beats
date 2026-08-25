import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dbDir = mkdtempSync(join(tmpdir(), "vylanous-newsletter-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";

const [{ default: app }, { db }, { subscribers }] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
]);

describe("newsletter signup", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("normalizes email addresses, enriches a fan-list record, and keeps one subscriber", async () => {
    const first = await app.request("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "  Fan@Example.COM " }),
    });
    const duplicate = await app.request("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "fan@example.com",
        firstName: "Avery",
        lastName: "Rhymes",
        sourcePageId: "page_home",
        sourceBlockId: "section_capture",
        workflowKey: "free-beat-download",
      }),
    });

    expect(first.status).toBe(200);
    expect(duplicate.status).toBe(200);
    const rows = await db.select().from(subscribers);
    const fans = rows.filter((row) => row.email === "fan@example.com");
    expect(fans).toHaveLength(1);
    expect(fans[0]).toMatchObject({
      firstName: "Avery",
      lastName: "Rhymes",
      sourcePageId: "page_home",
      sourceBlockId: "section_capture",
      workflowKey: "free-beat-download",
    });
  });
});
