import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { beats, checkoutIdempotencyKeys, orders, orderItems } from "../database/schema";
import { TIER_BY_ID, type LicenseTierId } from "../../shared/licenses";
import { rid, parseFileUrls, appUrl } from "../lib/util";
import { stripe } from "../lib/stripe";
import { sendDeliveryEmail } from "../lib/email";
import { currentCustomer, requireVerifiedCustomer } from "../lib/customer-auth";
import { activateOrderEntitlements } from "../lib/customer-portal";
import { enforceRateLimit, RATE_LIMITS } from "../lib/rate-limit";

const cartItemSchema = z.object({
  beatId: z.string(),
  tier: z.enum(["free", "mp3", "wav", "unlimited", "exclusive"]),
});

const checkoutSchema = z
  .object({
    items: z.array(cartItemSchema).min(1).max(25),
    idempotencyKey: z
      .string()
      .min(16)
      .max(120)
      .regex(/^[a-zA-Z0-9_-]+$/),
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

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function checkoutCartHash(items: Array<{ beatId: string; tier: LicenseTierId }>): string {
  const canonicalCart = [...items]
    .map((item) => `${item.beatId}:${item.tier}`)
    .sort()
    .join("|");
  return createHash("sha256").update(canonicalCart).digest("base64url");
}

export function checkoutRoutes(app: Hono) {
  app.post("/checkout", requireVerifiedCustomer, zValidator("json", checkoutSchema), async (c) => {
    const body = c.req.valid("json");
    const customer = await currentCustomer(c);
    const rateLimited = await enforceRateLimit(c, RATE_LIMITS.checkout, customer!.id);
    if (rateLimited) return rateLimited;

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

    const totalCents = resolved.reduce((sum, item) => sum + item.priceCents, 0);
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

    const orderId = rid("order");
    const downloadToken = randomBytes(24).toString("base64url");
    const cartHash = checkoutCartHash(resolved);
    const now = Date.now();
    const findExistingRequest = () =>
      db
        .select()
        .from(checkoutIdempotencyKeys)
        .where(
          and(
            eq(checkoutIdempotencyKeys.customerId, customer!.id),
            eq(checkoutIdempotencyKeys.requestKey, body.idempotencyKey),
          ),
        )
        .limit(1);
    const existingRequest = (await findExistingRequest())[0];

    if (existingRequest && existingRequest.expiresAt >= now) {
      if (existingRequest.cartHash !== cartHash) {
        return c.json({ error: "idempotency_key_reused" }, 409);
      }
      if (existingRequest.state !== "complete") {
        return c.json(
          { error: "checkout_processing", message: "Checkout is already being created." },
          409,
        );
      }
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, existingRequest.orderId))
        .limit(1);
      if (existingOrder?.totalCents === 0) {
        return c.json(
          {
            mode: "free",
            orderId: existingOrder.id,
            token: existingOrder.downloadToken,
            url: `/success?order=${existingOrder.id}&token=${existingOrder.downloadToken}`,
          },
          200,
        );
      }
      if (stripe && existingOrder?.stripeSessionId) {
        try {
          const session = await stripe.checkout.sessions.retrieve(existingOrder.stripeSessionId);
          if (session.url)
            return c.json({ mode: "stripe", orderId: existingOrder.id, url: session.url }, 200);
        } catch (error) {
          console.error("[checkout] idempotent Stripe session lookup failed", error);
        }
      }
      return c.json({ error: "checkout_session_unavailable" }, 409);
    }

    if (existingRequest?.expiresAt && existingRequest.expiresAt < now) {
      await db
        .delete(checkoutIdempotencyKeys)
        .where(eq(checkoutIdempotencyKeys.id, existingRequest.id));
    }

    try {
      await db.transaction(async (tx) => {
        await tx.insert(checkoutIdempotencyKeys).values({
          id: rid("checkout_request"),
          customerId: customer!.id,
          requestKey: body.idempotencyKey,
          cartHash,
          orderId,
          state: "processing",
          expiresAt: now + IDEMPOTENCY_TTL_MS,
        });
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
    } catch (error) {
      const racingRequest = (await findExistingRequest())[0];
      if (racingRequest && racingRequest.cartHash === cartHash) {
        return c.json(
          { error: "checkout_processing", message: "Checkout is already being created." },
          409,
        );
      }
      throw error;
    }

    if (allFree) {
      await activateOrderEntitlements(customer!.id, orderId);
      await sendDeliveryEmail(customer!.email, orderId, downloadToken).catch((error) =>
        console.error("[email] free order", error),
      );
      await db
        .update(checkoutIdempotencyKeys)
        .set({ state: "complete", updatedAt: new Date().toISOString() })
        .where(eq(checkoutIdempotencyKeys.orderId, orderId));
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
          .filter((item) => item.priceCents > 0)
          .map((item) => ({
            quantity: 1,
            price_data: {
              currency: "cad",
              unit_amount: item.priceCents,
              product_data: {
                name: `${item.beatTitle} — ${item.licenseName}`,
                images: item.artworkUrl.startsWith("http") ? [item.artworkUrl] : [],
              },
            },
          })),
        metadata: { orderId, downloadToken, customerId: customer!.id },
        success_url: `${base}/success?order=${orderId}&token=${downloadToken}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/cart?cancelled=1`,
      });

      await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, orderId));
      await db
        .update(checkoutIdempotencyKeys)
        .set({ state: "complete", updatedAt: new Date().toISOString() })
        .where(eq(checkoutIdempotencyKeys.orderId, orderId));
      return c.json({ mode: "stripe", orderId, url: session.url }, 200);
    } catch (error) {
      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
      await db.delete(checkoutIdempotencyKeys).where(eq(checkoutIdempotencyKeys.orderId, orderId));
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
