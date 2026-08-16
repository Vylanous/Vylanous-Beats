import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Context, Next } from "hono";
import { db } from "../database";
import {
  customers,
  customerEmailVerifications,
  customerSessions,
  type Customer,
} from "../database/schema";
import { rid } from "./util";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;
const RESEND_COOLDOWN_MS = 1000 * 60;

export type CustomerPublic = Pick<
  Customer,
  | "id"
  | "email"
  | "displayName"
  | "marketingOptIn"
  | "emailVerified"
  | "emailVerifiedAt"
  | "createdAt"
>;

export function publicCustomer(customer: Customer): CustomerPublic {
  return {
    id: customer.id,
    email: customer.email,
    displayName: customer.displayName,
    marketingOptIn: customer.marketingOptIn,
    emailVerified: customer.emailVerified,
    emailVerifiedAt: customer.emailVerifiedAt,
    createdAt: customer.createdAt,
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

function requestToken(c: Context) {
  const authorization = c.req.header("Authorization") || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : c.req.header("x-customer-token") || "";
}

export async function hashCustomerPassword(password: string) {
  return Bun.password.hash(password, { algorithm: "argon2id" });
}

export async function verifyCustomerPassword(password: string, hash: string) {
  return Bun.password.verify(password, hash);
}

export async function createCustomerVerificationToken(customerId: string) {
  const now = new Date().toISOString();
  await db
    .update(customerEmailVerifications)
    .set({ usedAt: now })
    .where(
      and(
        eq(customerEmailVerifications.customerId, customerId),
        isNull(customerEmailVerifications.usedAt),
      ),
    );
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
  await db.insert(customerEmailVerifications).values({
    id: rid("customer_email_verification"),
    customerId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });
  return { token: rawToken, expiresAt };
}

export async function verificationTokenRecentlySent(customerId: string) {
  const threshold = new Date(Date.now() - RESEND_COOLDOWN_MS).toISOString();
  const rows = await db
    .select({ id: customerEmailVerifications.id })
    .from(customerEmailVerifications)
    .where(
      and(
        eq(customerEmailVerifications.customerId, customerId),
        gt(customerEmailVerifications.createdAt, threshold),
      ),
    )
    .limit(1);
  return Boolean(rows[0]);
}

export async function verifyCustomerEmailToken(rawToken: string) {
  const now = new Date().toISOString();
  const rows = await db
    .select()
    .from(customerEmailVerifications)
    .where(
      and(
        eq(customerEmailVerifications.tokenHash, hashToken(rawToken)),
        isNull(customerEmailVerifications.usedAt),
        gt(customerEmailVerifications.expiresAt, now),
      ),
    )
    .limit(1);
  const verification = rows[0];
  if (!verification) return null;
  await db
    .update(customerEmailVerifications)
    .set({ usedAt: now })
    .where(eq(customerEmailVerifications.id, verification.id));
  await db
    .update(customers)
    .set({ emailVerified: true, emailVerifiedAt: now, updatedAt: now })
    .where(eq(customers.id, verification.customerId));
  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, verification.customerId))
    .limit(1);
  return customer[0] || null;
}

export async function createCustomerSession(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.insert(customerSessions).values({
    id: rid("customer_session"),
    customerId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return { token, expiresAt };
}

export async function customerFromRequest(c: Context): Promise<Customer | null> {
  const token = requestToken(c);
  if (!token) return null;
  const session = await db
    .select()
    .from(customerSessions)
    .where(
      and(
        eq(customerSessions.tokenHash, hashToken(token)),
        isNull(customerSessions.revokedAt),
        gt(customerSessions.expiresAt, new Date().toISOString()),
      ),
    )
    .limit(1);
  if (!session[0]) return null;
  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, session[0].customerId))
    .limit(1);
  return customer[0] || null;
}

export async function revokeCustomerSession(c: Context) {
  const token = requestToken(c);
  if (!token) return;
  await db
    .update(customerSessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(customerSessions.tokenHash, hashToken(token)));
}

export async function requireCustomer(c: Context, next: Next) {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ error: "customer_auth_required" }, 401);
  c.set("customer", customer);
  await next();
}

export async function requireVerifiedCustomer(c: Context, next: Next) {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ error: "customer_auth_required" }, 401);
  if (!customer.emailVerified) {
    return c.json({ error: "email_verification_required", email: customer.email }, 403);
  }
  c.set("customer", customer);
  await next();
}

export async function currentCustomer(c: Context) {
  const stored = c.get("customer") as Customer | undefined;
  return stored || customerFromRequest(c);
}
