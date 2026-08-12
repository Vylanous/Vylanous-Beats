import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Context, Next } from "hono";

/**
 * Lightweight single-admin auth. The store owner sets ADMIN_PASSWORD and
 * BETTER_AUTH_SECRET in environment variables. On login we mint an HMAC-signed
 * token (no DB needed) the client stores in localStorage and sends as a Bearer
 * header.
 *
 * Fail-closed: if either secret is missing, auth operations throw instead of
 * silently falling back to a hardcoded default. Set both vars in every
 * environment (see .env.template).
 */

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error("BETTER_AUTH_SECRET is not set");
  return s;
}

export function adminPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) throw new Error("ADMIN_PASSWORD is not set");
  return p;
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface AdminTokenPayload {
  sub: string; // unique token id
  iat: number;
  exp: number;
}

export function makeAdminToken(): string {
  const payload: AdminTokenPayload = {
    sub: randomBytes(18).toString("base64url"),
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, sig] = parts;
  let expected: string;
  try {
    expected = createHmac("sha256", secret()).update(body).digest("base64url");
  } catch {
    return false;
  }
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  let payload: AdminTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  if (!payload || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return false;
  if (Date.now() > payload.exp) return false;
  return true;
}

export function checkPassword(input: string): boolean {
  let expected: string;
  try {
    expected = adminPassword();
  } catch {
    return false;
  }
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
