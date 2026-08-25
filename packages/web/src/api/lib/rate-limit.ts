import { createHmac, randomUUID } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import type { Context } from "hono";
import { db } from "../database";
import { rateLimitWindows } from "../database/schema";

const RETENTION_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
let nextCleanupAt = 0;

export type RateLimitPolicy = {
  scope: string;
  limit: number;
  windowMs: number;
};

export const RATE_LIMITS = {
  adminLogin: { scope: "admin-login", limit: 5, windowMs: 15 * 60 * 1000 },
  customerRegister: { scope: "customer-register", limit: 5, windowMs: 60 * 60 * 1000 },
  customerLogin: { scope: "customer-login", limit: 10, windowMs: 15 * 60 * 1000 },
  customerVerify: { scope: "customer-verify", limit: 10, windowMs: 10 * 60 * 1000 },
  customerResend: { scope: "customer-resend", limit: 5, windowMs: 60 * 60 * 1000 },
  adminUpload: { scope: "admin-upload", limit: 30, windowMs: 10 * 60 * 1000 },
  newsletterSubscribe: { scope: "newsletter-subscribe", limit: 5, windowMs: 60 * 60 * 1000 },
  checkout: { scope: "checkout", limit: 10, windowMs: 10 * 60 * 1000 },
  orderConfirm: { scope: "order-confirm", limit: 20, windowMs: 10 * 60 * 1000 },
  beatPlay: { scope: "beat-play", limit: 60, windowMs: 60 * 1000 },
  publishedBeatEvent: { scope: "published-beat-event", limit: 120, windowMs: 60 * 1000 },
  invalidStripeWebhook: {
    scope: "invalid-stripe-webhook",
    limit: 30,
    windowMs: 15 * 60 * 1000,
  },
  invalidResendWebhook: {
    scope: "invalid-resend-webhook",
    limit: 30,
    windowMs: 15 * 60 * 1000,
  },
} as const satisfies Record<string, RateLimitPolicy>;

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

function isIpAddress(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f:.]{3,45}$/i.test(value));
}

/**
 * The production hostname is served through Cloudflare, which supplies this
 * header. Deliberately do not use X-Forwarded-For: Render appends rather than
 * resets it, so a client-controlled leftmost address would be spoofable.
 */
function trustedClientAddress(c: Context): string {
  const cloudflareAddress = c.req.header("cf-connecting-ip")?.trim();
  return isIpAddress(cloudflareAddress) ? cloudflareAddress : "unverified-source";
}

function subjectHash(c: Context, subject: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "rate-limit-local-development-secret";
  return createHmac("sha256", secret)
    .update(`${trustedClientAddress(c)}\u0000${subject}`)
    .digest("base64url");
}

function scheduleExpiredWindowCleanup(now: number) {
  if (now < nextCleanupAt) return;
  nextCleanupAt = now + CLEANUP_INTERVAL_MS;
  void db
    .delete(rateLimitWindows)
    .where(lt(rateLimitWindows.expiresAt, now))
    .catch((error) => console.error("[rate-limit] expired-window cleanup failed", error));
}

/**
 * Atomically consumes one request in a shared database bucket. The upsert only
 * increments while below the policy ceiling, avoiding races between instances.
 */
export async function consumeRateLimit(
  c: Context,
  policy: RateLimitPolicy,
  subject = "",
  now = Date.now(),
): Promise<RateLimitResult> {
  const windowStart = Math.floor(now / policy.windowMs) * policy.windowMs;
  const resetAt = windowStart + policy.windowMs;
  scheduleExpiredWindowCleanup(now);

  const rows = await db.all<{ hits: number }>(sql`
    insert into "rate_limit_windows" (
      "id", "scope", "subject_hash", "window_start", "hits", "expires_at", "updated_at"
    ) values (
      ${randomUUID()}, ${policy.scope}, ${subjectHash(c, subject)}, ${windowStart}, 1,
      ${resetAt + RETENTION_MS}, CURRENT_TIMESTAMP
    )
    on conflict ("scope", "subject_hash", "window_start") do update set
      "hits" = "rate_limit_windows"."hits" + 1,
      "updated_at" = CURRENT_TIMESTAMP
    where "rate_limit_windows"."hits" < ${policy.limit}
    returning "hits"
  `);

  const hits = Number(rows[0]?.hits ?? policy.limit);
  return {
    allowed: rows.length === 1,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - hits),
    resetAt,
  };
}

/** Returns a 429 response with standard retry metadata when the policy is exhausted. */
export async function enforceRateLimit(
  c: Context,
  policy: RateLimitPolicy,
  subject = "",
): Promise<Response | undefined> {
  const result = await consumeRateLimit(c, policy, subject);
  c.header("RateLimit-Limit", String(result.limit));
  c.header("RateLimit-Remaining", String(result.remaining));
  c.header("RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  if (result.allowed) return undefined;

  c.header("Retry-After", String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))));
  return c.json(
    { error: "rate_limited", message: "Too many requests. Please try again later." },
    429,
  );
}
