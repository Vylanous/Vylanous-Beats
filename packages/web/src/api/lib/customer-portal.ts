import { and, desc, eq } from "drizzle-orm";
import { db } from "../database";
import { customerEntitlements, orderItems, orders, type Customer } from "../database/schema";
import { signIfKey } from "./url-sign";
import { rid } from "./util";

export async function activateOrderEntitlements(customerId: string, orderId: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const now = new Date().toISOString();
  for (const item of items) {
    await db
      .insert(customerEntitlements)
      .values({
        id: rid("entitlement"),
        customerId,
        orderId,
        orderItemId: item.id,
        beatId: item.beatId,
        status: "active",
        activatedAt: now,
      })
      .onConflictDoNothing();
  }
}

/** Claims historical email-delivered orders when their buyer creates the matching account. */
export async function claimLegacyOrders(customer: Pick<Customer, "id" | "email">) {
  await db
    .update(orders)
    .set({ customerId: customer.id })
    .where(and(eq(orders.email, customer.email), eq(orders.customerId, "")));
  const paid = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.customerId, customer.id), eq(orders.status, "paid")));
  await Promise.all(paid.map((order) => activateOrderEntitlements(customer.id, order.id)));
}

export async function customerEntitlementsFor(customerId: string) {
  const rows = await db
    .select({
      id: customerEntitlements.id,
      orderId: customerEntitlements.orderId,
      beatId: customerEntitlements.beatId,
      createdAt: customerEntitlements.createdAt,
      licenseTier: orderItems.licenseTier,
      licenseName: orderItems.licenseName,
      beatTitle: orderItems.beatTitle,
      fileUrl: orderItems.fileUrl,
    })
    .from(customerEntitlements)
    .innerJoin(orderItems, eq(customerEntitlements.orderItemId, orderItems.id))
    .where(
      and(
        eq(customerEntitlements.customerId, customerId),
        eq(customerEntitlements.status, "active"),
      ),
    )
    .orderBy(desc(customerEntitlements.createdAt));
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      downloadUrl: await signIfKey(row.fileUrl),
    })),
  );
}

export async function customerDashboard(customer: Customer) {
  const ownedOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt));
  const entitlements = await customerEntitlementsFor(customer.id);
  const paid = ownedOrders.filter((order) => order.status === "paid");
  const totalSpentCents = paid.reduce((sum, order) => sum + order.totalCents, 0);
  return {
    customer: {
      id: customer.id,
      email: customer.email,
      displayName: customer.displayName,
      marketingOptIn: customer.marketingOptIn,
    },
    insights: {
      paidOrders: paid.length,
      licensesOwned: entitlements.length,
      totalSpentCents,
    },
    orders: ownedOrders.map((order) => ({
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    })),
    entitlements,
  };
}

export async function authorizedDownload(customerId: string, entitlementId: string) {
  const rows = await db
    .select({ fileUrl: orderItems.fileUrl, status: customerEntitlements.status })
    .from(customerEntitlements)
    .innerJoin(orderItems, eq(customerEntitlements.orderItemId, orderItems.id))
    .where(
      and(
        eq(customerEntitlements.id, entitlementId),
        eq(customerEntitlements.customerId, customerId),
      ),
    )
    .limit(1);
  const entitlement = rows[0];
  if (!entitlement || entitlement.status !== "active") return null;
  return signIfKey(entitlement.fileUrl);
}
