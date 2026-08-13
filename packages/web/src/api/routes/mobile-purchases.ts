import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../database";
import { beats, mobilePurchaseTransactions, orderItems, orders } from "../database/schema";
import { sendDeliveryEmail } from "../lib/email";
import {
  MobileStoreVerificationError,
  tierForMobileProduct,
  verifyMobileStoreTransaction,
} from "../lib/mobile-store-verifier";
import { parseFileUrls, rid } from "../lib/util";
import { TIER_BY_ID } from "../../shared/licenses";

const purchaseSchema = z.object({
  platform: z.enum(["apple", "google"]),
  environment: z.enum(["sandbox", "production"]),
  transactionId: z.string().trim().min(6).max(1024),
  purchaseToken: z.string().trim().min(6).max(8192).optional(),
  productId: z.string().trim().min(3).max(255),
  beatId: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(320),
  name: z.string().trim().max(160).optional().default(""),
});

type FulfillmentResult = {
  orderId: string;
  downloadToken: string;
  tier: string;
  replay: boolean;
};

/**
 * Store-native purchase fulfillment. The client never decides whether a
 * transaction is valid; it supplies a receipt/token that is checked against
 * Apple or Google before any paid order or download entitlement is created.
 */
export function mobilePurchaseRoutes(app: Hono) {
  app.post("/mobile/purchases/verify-and-fulfill", zValidator("json", purchaseSchema), async (c) => {
    const body = c.req.valid("json");
    const expectedTier = tierForMobileProduct(body.productId);
    if (!expectedTier) return c.json({ error: "Unknown mobile license product." }, 400);

    const prior = await db
      .select()
      .from(mobilePurchaseTransactions)
      .where(
        and(
          eq(mobilePurchaseTransactions.platform, body.platform),
          eq(mobilePurchaseTransactions.transactionId, body.transactionId),
        ),
      )
      .limit(1);

    if (prior[0]?.status === "revoked") {
      return c.json({ error: "This purchase has been revoked." }, 409);
    }
    if (prior[0]?.status === "fulfilled" && prior[0].orderId) {
      return c.json(
        {
          ok: true,
          replay: true,
          orderId: prior[0].orderId,
          message: "This purchase was already fulfilled. Check your delivery email for the license files.",
        },
        200,
      );
    }

    let verified;
    try {
      verified = await verifyMobileStoreTransaction({
        platform: body.platform,
        environment: body.environment,
        transactionId: body.transactionId,
        purchaseToken: body.purchaseToken,
        productId: body.productId,
      });
    } catch (error) {
      if (error instanceof MobileStoreVerificationError) {
        return c.json({ error: error.message }, error.status);
      }
      throw error;
    }

    if (verified.productId !== body.productId || verified.transactionId !== body.transactionId) {
      return c.json({ error: "Store transaction did not match this purchase request." }, 422);
    }

    let fulfillment: FulfillmentResult;
    try {
      fulfillment = await db.transaction(async (tx) => {
        const replay = await tx
          .select()
          .from(mobilePurchaseTransactions)
          .where(
            and(
              eq(mobilePurchaseTransactions.platform, body.platform),
              eq(mobilePurchaseTransactions.transactionId, body.transactionId),
            ),
          )
          .limit(1);
        if (replay[0]?.status === "fulfilled" && replay[0].orderId) {
          return {
            orderId: replay[0].orderId,
            downloadToken: "",
            tier: replay[0].licenseTier,
            replay: true,
          };
        }

        const beatRows = await tx.select().from(beats).where(eq(beats.id, body.beatId)).limit(1);
        const beat = beatRows[0];
        if (!beat || !beat.published) throw new MobileStoreVerificationError("This beat is unavailable.", 409);
        if (expectedTier === "exclusive" && beat.soldExclusive) {
          throw new MobileStoreVerificationError("This beat has already been sold exclusively.", 409);
        }

        const tier = TIER_BY_ID[expectedTier];
        const orderId = replay[0]?.orderId || rid("order");
        const downloadToken = randomBytes(24).toString("base64url");
        const files = parseFileUrls(beat.fileUrls);
        const now = new Date().toISOString();

        if (replay[0]) {
          await tx
            .update(mobilePurchaseTransactions)
            .set({
              productId: body.productId,
              beatId: beat.id,
              licenseTier: expectedTier,
              buyerEmail: body.email,
              orderId,
              status: "verified",
              storeEnvironment: verified.environment,
              purchaseToken: verified.purchaseToken,
              verificationPayload: JSON.stringify({
                productId: verified.productId,
                platform: verified.platform,
                environment: verified.environment,
              }),
              verifiedAt: now,
            })
            .where(eq(mobilePurchaseTransactions.id, replay[0].id));
        } else {
          await tx.insert(mobilePurchaseTransactions).values({
            id: rid("mobile_tx"),
            platform: verified.platform,
            transactionId: verified.transactionId,
            productId: verified.productId,
            purchaseToken: verified.purchaseToken,
            beatId: beat.id,
            licenseTier: expectedTier,
            buyerEmail: body.email,
            orderId,
            status: "verified",
            storeEnvironment: verified.environment,
            verificationPayload: JSON.stringify({
              productId: verified.productId,
              platform: verified.platform,
              environment: verified.environment,
            }),
            verifiedAt: now,
          });
        }

        await tx.insert(orders).values({
          id: orderId,
          email: body.email,
          name: body.name,
          status: "paid",
          totalCents: tier.priceCents,
          currency: "cad",
          downloadToken,
          paidAt: now,
        });
        await tx.insert(orderItems).values({
          id: rid("item"),
          orderId,
          beatId: beat.id,
          beatTitle: beat.title,
          licenseTier: expectedTier,
          licenseName: tier.name,
          priceCents: tier.priceCents,
          fileUrl: files[expectedTier] || beat.audioUrl,
        });

        if (expectedTier === "exclusive") {
          await tx.update(beats).set({ soldExclusive: true }).where(eq(beats.id, beat.id));
        }

        return { orderId, downloadToken, tier: expectedTier, replay: false };
      });
    } catch (error) {
      if (error instanceof MobileStoreVerificationError) {
        return c.json({ error: error.message }, error.status);
      }
      throw error;
    }

    if (fulfillment.replay) {
      return c.json(
        {
          ok: true,
          replay: true,
          orderId: fulfillment.orderId,
          message: "This purchase was already fulfilled. Check your delivery email for the license files.",
        },
        200,
      );
    }

    try {
      await sendDeliveryEmail(body.email, fulfillment.orderId, fulfillment.downloadToken);
      await db
        .update(mobilePurchaseTransactions)
        .set({ status: "fulfilled", fulfilledAt: new Date().toISOString() })
        .where(
          and(
            eq(mobilePurchaseTransactions.platform, body.platform),
            eq(mobilePurchaseTransactions.transactionId, body.transactionId),
          ),
        );
    } catch (error) {
      console.error("[mobile-purchase] delivery email failed", {
        platform: body.platform,
        transactionId: body.transactionId,
      });
      return c.json(
        {
          error:
            "Your purchase is verified, but delivery email is delayed. Please contact support@vylanous.com with your transaction ID.",
          orderId: fulfillment.orderId,
        },
        202,
      );
    }

    return c.json(
      {
        ok: true,
        replay: false,
        orderId: fulfillment.orderId,
        licenseTier: fulfillment.tier,
        message: "Purchase confirmed. Your license files are on their way to your email.",
      },
      201,
    );
  });
}
