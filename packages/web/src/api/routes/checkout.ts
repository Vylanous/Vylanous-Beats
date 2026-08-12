import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { beats, orders, orderItems } from "../database/schema";
import { TIER_BY_ID, type LicenseTierId } from "../../shared/licenses";
import { rid, parseFileUrls, appUrl } from "../lib/util";
import { stripe } from "../lib/stripe";
import { sendDeliveryEmail } from "../lib/email";

const cartItemSchema = z.object({
  beatId: z.string(),
  tier: z.enum(["free", "mp3", "wav", "unlimited", "exclusive"]),
});

const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().optional().default(""),
  items: z.array(cartItemSchema).min(1),
});

export function checkoutRoutes(app: Hono) {
  app.post("/checkout", zValidator("json", checkoutSchema), async (c) => {
    const body = c.req.valid("json");

    const resolved: {
      beatId: string;
      beatTitle: string;
      tier: LicenseTierId;
      licenseName: string;
      priceCents: number;
      fileUrl: string;
      artworkUrl: string;
    }[] = [];

    for (const item of body.items) {
      const rows = await db.select().from(beats).where(eq(beats.id, item.beatId)).limit(1);
      if (rows.length === 0) continue;
      const beat = rows[0];
      const tier = TIER_BY_ID[item.tier];
      if (!tier) continue;
      if (item.tier === "exclusive" && beat.soldExclusive) {
        return c.json({ error: `"${beat.title}" is already sold exclusively.` }, 409);
      }
      const files = parseFileUrls(beat.fileUrls);
      resolved.push({
        beatId: beat.id,
        beatTitle: beat.title,
        tier: item.tier,
        licenseName: tier.name,
        priceCents: tier.priceCents,
        fileUrl: files[item.tier] || beat.audioUrl,
        artworkUrl: beat.artworkUrl,
      });
    }

    if (resolved.length === 0) return c.json({ error: "No valid items" }, 400);

    const totalCents = resolved.reduce((s, i) => s + i.priceCents, 0);
    const orderId = rid("order");
    const downloadToken = randomBytes(24).toString("base64url");

    const allFree = totalCents === 0;

    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: orderId,
        email: body.email,
        name: body.name,
        status: allFree ? "paid" : "pending",
        totalCents,
        currency: "cad",
        downloadToken,
        paidAt: allFree ? new Date().toISOString() : null,
      });
      for (const item of resolved) {
        await tx.insert(orderItems).values({
          id: rid("item"),
          orderId,
          beatId: item.beatId,
          beatTitle: item.beatTitle,
          licenseTier: item.tier,
          licenseName: item.licenseName,
          priceCents: item.priceCents,
          fileUrl: item.fileUrl,
        });
      }
    });

    if (allFree) {
      await sendDeliveryEmail(body.email, orderId, downloadToken).catch((e) =>
        console.error("[email] free order", e),
      );
      return c.json(
        { mode: "free", orderId, token: downloadToken, url: `/success?order=${orderId}&token=${downloadToken}` },
        200,
      );
    }

    if (!stripe) {
      return c.json(
        {
          error: "stripe_not_configured",
          message:
            "Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable real payments.",
        },
        503,
      );
    }

    const base = appUrl() || new URL(c.req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email,
      line_items: resolved
        .filter((i) => i.priceCents > 0)
        .map((i) => ({
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: i.priceCents,
            product_data: {
              name: `${i.beatTitle} — ${i.licenseName}`,
              images: i.artworkUrl.startsWith("http") ? [i.artworkUrl] : [],
            },
          },
        })),
      metadata: { orderId, downloadToken },
      success_url: `${base}/success?order=${orderId}&token=${downloadToken}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart?cancelled=1`,
    });

    await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, orderId));

    return c.json({ mode: "stripe", orderId, url: session.url }, 200);
  });
}
