import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dbDir = mkdtempSync(join(tmpdir(), "vylanous-admin-session-test-"));
process.env.DATABASE_URL = `file:${join(dbDir, "test.db")}`;
process.env.ADMIN_PASSWORD = "integration-test-password";
process.env.BETTER_AUTH_SECRET = "integration-test-secret-that-is-long-enough";

const [{ default: app }, { db }, { adminSessions }] = await Promise.all([
  import("../index"),
  import("../database"),
  import("../database/schema"),
]);

describe("admin server-managed sessions", () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test("uses an HttpOnly cookie, rejects bearer tokens, and revokes on logout", async () => {
    const login = await app.request("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "integration-test-password" }),
    });
    expect(login.status).toBe(200);
    expect(await login.json()).toEqual({ ok: true });
    const setCookie = login.headers.get("set-cookie");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
    const cookie = setCookie!.split(";")[0];

    const bearerAttempt = await app.request("/api/admin/me", {
      headers: { Authorization: "Bearer browser-readable-token" },
    });
    expect(bearerAttempt.status).toBe(401);

    const authenticated = await app.request("/api/admin/me", { headers: { Cookie: cookie } });
    expect(authenticated.status).toBe(200);
    expect(await db.select().from(adminSessions)).toHaveLength(1);

    const logout = await app.request("/api/admin/logout", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(logout.status).toBe(200);
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");

    const revoked = await app.request("/api/admin/me", { headers: { Cookie: cookie } });
    expect(revoked.status).toBe(401);
  });
});
