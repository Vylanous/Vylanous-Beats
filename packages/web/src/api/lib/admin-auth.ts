import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context, Next } from "hono";
import { db } from "../database";
import { adminSessions } from "../database/schema";

const ADMIN_SESSION_COOKIE = "vylanous_admin_session";
const ADMIN_SESSION_ABSOLUTE_TTL_MS = 8 * 60 * 60 * 1000;
const ADMIN_SESSION_IDLE_TTL_MS = 2 * 60 * 60 * 1000;

type AdminSession = typeof adminSessions.$inferSelect;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function adminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return password;
}

export function checkPassword(input: string): boolean {
  let expected: string;
  try {
    expected = adminPassword();
  } catch {
    return false;
  }
  try {
    const actualBytes = Buffer.from(input);
    const expectedBytes = Buffer.from(expected);
    return (
      actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes)
    );
  } catch {
    return false;
  }
}

export async function createAdminSession(): Promise<{ token: string }> {
  const now = Date.now();
  const token = randomBytes(32).toString("base64url");
  await db.insert(adminSessions).values({
    id: randomBytes(18).toString("base64url"),
    tokenHash: hashToken(token),
    expiresAt: now + ADMIN_SESSION_ABSOLUTE_TTL_MS,
    idleExpiresAt: now + ADMIN_SESSION_IDLE_TTL_MS,
    lastSeenAt: new Date(now).toISOString(),
  });
  return { token };
}

function clearAdminSessionCookie(c: Context) {
  deleteCookie(c, ADMIN_SESSION_COOKIE, {
    path: "/api",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "Strict",
  });
}

export function setAdminSessionCookie(c: Context, token: string) {
  setCookie(c, ADMIN_SESSION_COOKIE, token, {
    path: "/api",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: Math.floor(ADMIN_SESSION_ABSOLUTE_TTL_MS / 1000),
  });
}

async function sessionFromRequest(c: Context): Promise<AdminSession | undefined> {
  const token = getCookie(c, ADMIN_SESSION_COOKIE);
  if (!token) return undefined;
  const now = Date.now();
  const [session] = await db
    .select()
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.tokenHash, hashToken(token)),
        isNull(adminSessions.revokedAt),
        gt(adminSessions.expiresAt, now),
        gt(adminSessions.idleExpiresAt, now),
      ),
    )
    .limit(1);
  if (!session) return undefined;

  const refreshedIdleExpiry = Math.min(session.expiresAt, now + ADMIN_SESSION_IDLE_TTL_MS);
  await db
    .update(adminSessions)
    .set({ idleExpiresAt: refreshedIdleExpiry, lastSeenAt: new Date(now).toISOString() })
    .where(eq(adminSessions.id, session.id));
  return { ...session, idleExpiresAt: refreshedIdleExpiry };
}

export async function revokeCurrentAdminSession(c: Context): Promise<void> {
  const session = await sessionFromRequest(c);
  if (session) {
    await db
      .update(adminSessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(adminSessions.id, session.id));
  }
  clearAdminSessionCookie(c);
}

export async function revokeAllAdminSessions(c: Context): Promise<void> {
  await db
    .update(adminSessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(isNull(adminSessions.revokedAt));
  clearAdminSessionCookie(c);
}

/** Hono middleware guarding Admin Studio routes with a server-side session. */
export async function requireAdmin(c: Context, next: Next) {
  const session = await sessionFromRequest(c);
  if (!session) {
    clearAdminSessionCookie(c);
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
}
