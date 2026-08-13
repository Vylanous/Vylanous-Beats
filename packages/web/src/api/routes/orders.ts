import { eq } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { orders, orderItems, beats } from "../database/schema";
import { signIfKey } from "../lib/url-sign";
import { stripe } from "../lib/stripe";
import { sendDeliveryEmail } from "../lib/email";
import { customerFromRequest } from "../lib/customer-auth";
import { activateOrderEntitlements } from "../lib/customer-portal";

export function ordersRoutes(app: Hono) {
  app.post("/orders/:id/confirm", async (c) => {
    const id = c.req.param("id");
    const token = c.req.query("token") || "";
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    const order = rows[0];
    const customer = await customerFromRequest(c);
    const owner = Boolean(customer && order.customerId && order.customerId === customer.id);
    if (!owner && order.downloadToken !== token) return c.json({ error: "Invalid token" }, 403);

    if (order.status !== "paid" && stripe && order.stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_status === "paid") {
          await db
            .update(orders)
            .set({ status: "paid", paidAt: new Date().toISOString() })
            .where(eq(orders.id, id));
          order.status = "paid";
          if (order.customerId) await activateOrderEntitlements(order.customerId, id);
          const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
          for (const it of items) {
            if (it.licenseTier === "exclusive") {
              await db
                .update(beats)
                .set({ soldExclusive: true, published: false })
                .where(eq(beats.id, it.beatId));
            }
          }
          await sendDeliveryEmail(order.email, id, token).catch((e) =>
            console.error("[email] paid order", e),
          );
        }
      } catch (e) {
        console.error("[confirm] stripe retrieve failed", e);
      }
    }

    return c.json({ status: order.status }, 200);
  });

  app.get("/orders/:id", async (c) => {
    const id = c.req.param("id");
    const token = c.req.query("token") || "";
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    const order = rows[0];
    const customer = await customerFromRequest(c);
    const owner = Boolean(customer && order.customerId && order.customerId === customer.id);
    if (!owner && order.downloadToken !== token) return c.json({ error: "Invalid token" }, 403);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const unlocked = order.status === "paid";
    return c.json(
      {
        order: {
          id: order.id,
          email: order.email,
          name: order.name,
          status: order.status,
          totalCents: order.totalCents,
          createdAt: order.createdAt,
        },
        items: await Promise.all(
          items.map(async (i) => ({
            beatTitle: i.beatTitle,
            licenseName: i.licenseName,
            licenseTier: i.licenseTier,
            priceCents: i.priceCents,
            downloadUrl: unlocked ? await signIfKey(i.fileUrl) : null,
          })),
        ),
        unlocked,
      },
      200,
    );
  });
}
