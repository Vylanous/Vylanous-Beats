import { and, eq } from "drizzle-orm";
import type { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../database";
import { customers, subscribers } from "../database/schema";
import {
  createCustomerSession,
  currentCustomer,
  hashCustomerPassword,
  publicCustomer,
  requireCustomer,
  revokeCustomerSession,
  verifyCustomerPassword,
} from "../lib/customer-auth";
import { authorizedDownload, claimLegacyOrders, customerDashboard } from "../lib/customer-portal";
import { rid } from "../lib/util";

const registrationSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().max(160).optional().default(""),
  marketingOptIn: z.boolean().optional().default(false),
});
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});
const preferenceSchema = z.object({
  displayName: z.string().trim().max(160).optional(),
  marketingOptIn: z.boolean().optional(),
});

async function syncSubscriber(email: string) {
  const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
  if (!existing[0]) await db.insert(subscribers).values({ id: rid("subscriber"), email });
}

export function customerPortalRoutes(app: Hono) {
  app.post("/customer/register", zValidator("json", registrationSchema), async (c) => {
    const body = c.req.valid("json");
    const duplicate = await db
      .select()
      .from(customers)
      .where(eq(customers.email, body.email))
      .limit(1);
    if (duplicate[0]) return c.json({ error: "email_already_registered" }, 409);
    const customer = {
      id: rid("customer"),
      email: body.email,
      displayName: body.displayName,
      passwordHash: await hashCustomerPassword(body.password),
      marketingOptIn: body.marketingOptIn,
    };
    await db.insert(customers).values(customer);
    if (body.marketingOptIn) await syncSubscriber(body.email);
    await claimLegacyOrders(customer);
    const session = await createCustomerSession(customer.id);
    return c.json(
      {
        customer: publicCustomer({
          ...customer,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        }),
        session,
      },
      201,
    );
  });

  app.post("/customer/login", zValidator("json", loginSchema), async (c) => {
    const body = c.req.valid("json");
    const rows = await db.select().from(customers).where(eq(customers.email, body.email)).limit(1);
    const customer = rows[0];
    if (!customer || !(await verifyCustomerPassword(body.password, customer.passwordHash))) {
      return c.json({ error: "invalid_credentials" }, 401);
    }
    await claimLegacyOrders(customer);
    const session = await createCustomerSession(customer.id);
    return c.json({ customer: publicCustomer(customer), session }, 200);
  });

  app.post("/customer/logout", requireCustomer, async (c) => {
    await revokeCustomerSession(c);
    return c.json({ ok: true }, 200);
  });

  app.get("/customer/me", requireCustomer, async (c) => {
    const customer = await currentCustomer(c);
    return c.json({ customer: publicCustomer(customer!) }, 200);
  });

  app.get("/customer/dashboard", requireCustomer, async (c) => {
    const customer = await currentCustomer(c);
    return c.json(await customerDashboard(customer!), 200);
  });

  app.get("/customer/entitlements/:id/download", requireCustomer, async (c) => {
    const customer = await currentCustomer(c);
    const url = await authorizedDownload(customer!.id, c.req.param("id"));
    if (!url) return c.json({ error: "entitlement_not_found" }, 404);
    return c.json({ url }, 200);
  });

  app.patch(
    "/customer/preferences",
    requireCustomer,
    zValidator("json", preferenceSchema),
    async (c) => {
      const customer = await currentCustomer(c);
      const patch = c.req.valid("json");
      await db
        .update(customers)
        .set({ ...patch, updatedAt: new Date().toISOString() })
        .where(and(eq(customers.id, customer!.id), eq(customers.email, customer!.email)));
      if (patch.marketingOptIn) await syncSubscriber(customer!.email);
      const [updated] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customer!.id))
        .limit(1);
      return c.json({ customer: publicCustomer(updated) }, 200);
    },
  );
}
