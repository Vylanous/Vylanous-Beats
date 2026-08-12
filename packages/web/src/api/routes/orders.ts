import { eq } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { orders, orderItems } from "../database/schema";
import { signIfKey } from "../lib/url-sign";
import { stripe } from "../lib/stripe";
import { fulfillOrder } from "../lib/fulfill";

export function ordersRoutes(app: Hono) {
  app.post("/orders/:id/confirm", async (c) => {
    const id = c.req.param("id");
    const token = c.req.query("token") || "";
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    const order = rows[0];
    if (order.downloadToken !== token) return c.json({ error: "Invalid token" }, 403);

    if (order.status !== "paid" && stripe && order.stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_status === "paid") {
          await fulfillOrder(id);
          order.status = "paid";
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
    if (order.downloadToken !== token) return c.json({ error: "Invalid token" }, 403);
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
