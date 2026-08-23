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
import { currentCustomer, requireVerifiedCustomer } from "../lib/customer-auth";
import { activateOrderEntitlements } from "../lib/customer-portal";

const cartItemSchema = z.object({
  beatId: z.string(),
  tier: z.enum(["free", "mp3", "wav", "unlimited", "exclusive"]),
});

const checkoutSchema = z
  .object({
    items: z.array(cartItemSchema).min(1).max(25),
  })
  .superRefine(({ items }, ctx) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const key = `${item.beatId}:${item.tier}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index],
          message: "Each beat and license tier can only appear once in a checkout.",
        });
      }
      seen.add(key);
    });
  });

export function checkoutRoutes(app: Hono) {
  app.post("/checkout", requireVerifiedCustomer, zValidator("json", checkoutSchema), async (c) => {
    const body = c.req.valid("json");
    const customer = await currentCustomer(c);

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
      if (rows.length === 0 || !rows[0].published) {
        return c.json(
          { error: "A beat in your cart is no longer available. Refresh your cart and try again." },
          409,
        );
      }
      const beat = rows[0];
      const tier = TIER_BY_ID[item.tier];
      if (!tier) return c.json({ error: "An item in your cart has an invalid license tier." }, 400);
      if (item.tier === "exclusive" && beat.soldExclusive) {
        return c.json({ error: `"${beat.title}" is already sold exclusively.` }, 409);
      }
      const files = parseFileUrls(beat.fileUrls);
      const fileUrl = files[item.tier] || beat.audioUrl;
      if (!fileUrl) {
        return c.json(
          {
            error: `"${beat.title}" is temporarily unavailable because its delivery file has not been configured.`,
          },
          409,
        );
      }
      resolved.push({
        beatId: beat.id,
        beatTitle: beat.title,
        tier: item.tier,
        licenseName: tier.name,
        priceCents: tier.priceCents,
        fileUrl,
        artworkUrl: beat.artworkUrl,
      });
    }

    const totalCents = resolved.reduce((s, i) => s + i.priceCents, 0);
    const orderId = rid("order");
    const downloadToken = randomBytes(24).toString("base64url");

    const allFree = totalCents === 0;

    if (!allFree && !stripe) {
      return c.json(
        {
          error: "stripe_not_configured",
          message: "Checkout is temporarily unavailable. Please contact support@vylanous.com.",
        },
        503,
      );
    }

    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: orderId,
        customerId: customer!.id,
        email: customer!.email,
        name: customer!.displayName,
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
      await activateOrderEntitlements(customer!.id, orderId);
      await sendDeliveryEmail(customer!.email, orderId, downloadToken).catch((e) =>
        console.error("[email] free order", e),
      );
      return c.json(
        {
          mode: "free",
          orderId,
          token: downloadToken,
          url: `/success?order=${orderId}&token=${downloadToken}`,
        },
        200,
      );
    }

    const base = appUrl() || new URL(c.req.url).origin;
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customer!.email,
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
        metadata: { orderId, downloadToken, customerId: customer!.id },
        success_url: `${base}/success?order=${orderId}&token=${downloadToken}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/cart?cancelled=1`,
      });

      await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, orderId));
      return c.json({ mode: "stripe", orderId, url: session.url }, 200);
    } catch (error) {
      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
      console.error("[checkout] Stripe session creation failed", error);
      return c.json(
        {
          error: "checkout_unavailable",
          message: "Checkout could not be started. Please try again.",
        },
        503,
      );
    }
  });
}
