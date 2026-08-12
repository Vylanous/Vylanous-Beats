import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Context, Next } from "hono";

/**
 * Single-admin auth for the store owner.
 *
 * Required environment variables (the server refuses to start without them):
 *   ADMIN_TOKEN_SECRET (or BETTER_AUTH_SECRET)  — >= 16 chars, signs session tokens
 *   ADMIN_PASSWORD_HASH  — sha256 hex of the password   (preferred)
 *     or ADMIN_PASSWORD   — plaintext password           (fallback, hashed at boot)
 *
 * There are deliberately NO default values: a public repo with a default
 * password/secret means anyone can log in *or* forge a valid session token.
 */

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function readSecret(): string {
  const secret = process.env.ADMIN_TOKEN_SECRET || process.env.BETTER_AUTH_SECRET || "";
  if (secret.length < 16) {
    throw new Error(
      "[admin-auth] ADMIN_TOKEN_SECRET (or BETTER_AUTH_SECRET) must be set to at least 16 characters. " +
        "Generate one with: openssl rand -base64 32",
    );
  }
  return secret;
}

function readPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (hash) {
    if (!/^[0-9a-f]{64}$/i.test(hash)) {
      throw new Error("[admin-auth] ADMIN_PASSWORD_HASH must be a 64-char sha256 hex digest.");
    }
    return hash.toLowerCase();
  }
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) {
    throw new Error(
      "[admin-auth] Set ADMIN_PASSWORD_HASH (sha256 hex) or ADMIN_PASSWORD. There is no default password.",
    );
  }
  if (plain.length < 10) {
    throw new Error("[admin-auth] ADMIN_PASSWORD must be at least 10 characters.");
  }
  return sha256Hex(plain);
}

// Validated once, at import time, so misconfiguration fails the deploy
// instead of silently shipping a guessable admin panel.
const SECRET = readSecret();
const PASSWORD_HASH = readPasswordHash();

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function makeAdminToken(): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const jti = randomBytes(8).toString("base64url");
  const payload = Buffer.from(`${exp}.${jti}`, "utf8").toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const exp = Number(Buffer.from(payload, "base64url").toString("utf8").split(".")[0]);
  return Number.isFinite(exp) && Date.now() <= exp;
}

/** Constant-time password check against the configured sha256 digest. */
export function checkPassword(input: string): boolean {
  if (typeof input !== "string" || input.length === 0) return false;
  return safeEqualHex(sha256Hex(input), PASSWORD_HASH);
}

/* ------------------------------------------------------------------ */
/* Login rate limiting — in-memory, per IP                            */
/* ------------------------------------------------------------------ */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(c: Context): string {
  const fwd = c.req.header("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return c.req.header("fly-client-ip") || c.req.header("x-real-ip") || "unknown";
}

/** Clear the counter for this IP — call after a successful login. */
export function resetLoginAttempts(c: Context) {
  attempts.delete(clientIp(c));
}

/** Hono middleware: blocks brute-force password guessing on /admin/login. */
export async function loginRateLimit(c: Context, next: Next) {
  const ip = clientIp(c);
  const now = Date.now();

  // opportunistic cleanup so the map can't grow unbounded
  if (attempts.size > 5000) {
    for (const [key, entry] of attempts) if (entry.resetAt <= now) attempts.delete(key);
  }

  const entry = attempts.get(ip);
  if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    c.header("Retry-After", String(retryAfter));
    return c.json({ error: "too_many_attempts", retryAfter }, 429);
  }
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }

  await next();
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
