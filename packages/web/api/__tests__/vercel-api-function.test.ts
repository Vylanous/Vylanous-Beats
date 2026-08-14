import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The Vercel function imports the same Hono app used in production. Configure
// a disposable database before importing it so this test remains isolated.
const dbDir = mkdtempSync(join(tmpdir(), "vylanous-vercel-function-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";

const { default: handler } = await import("../[...path]");

describe("Vercel API function", () => {
  test("serves the Hono health endpoint through the catch-all function", async () => {
    const response = await handler(new Request("http://localhost/api/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
