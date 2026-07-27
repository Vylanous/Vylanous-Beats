import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context, Next } from "hono";

/**
 * Lightweight single-admin auth. The store owner sets ADMIN_PASSWORD in Vercel
 * Environment Variables. On login we mint an HMAC-signed token (no DB needed)
 * the client stores in localStorage and sends as a Bearer header.
 */

function secret(): string {
  return process.env.BETTER_AUTH_SECRET || process.env.ADMIN_PASSWORD || "vylanous-admin-secret";
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "vylanous";
}

export function makeAdminToken(): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const payload = Buffer.from(String(exp)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const exp = Number(Buffer.from(payload, "base64url").toString("utf8"));
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}

export function checkPassword(input: string): boolean {
  const expected = adminPassword();
  try {
    const a = Buffer.from(input);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Hono middleware guarding admin routes. */
export async function requireAdmin(c: Context, next: Next) {
  const header = c.req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : c.req.header("x-admin-token");
  if (!verifyAdminToken(token)) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
}
