import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import Stripe from "stripe";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db, client } from "./database";
import { beats, orders, orderItems, subscribers, settings } from "./database/schema";
import { seedDatabase } from "./seed";
import { TIER_BY_ID, type LicenseTierId } from "../shared/licenses";
import { s3, S3_BUCKET } from "./lib/s3";
import { requireAdmin, checkPassword, makeAdminToken } from "./lib/admin-auth";
import { mergeSettings, type SiteSettings } from "../shared/site-settings";

// Seed on cold start (idempotent)
seedDatabase().catch((e) => console.error("[seed] failed", e));

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey) : null;

function appUrl(): string {
  return process.env.APP_URL || process.env.PUBLIC_URL || "";
}

function rid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const cartItemSchema = z.object({
  beatId: z.string(),
  tier: z.enum(["free", "mp3", "wav", "unlimited", "exclusive"]),
});

const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().optional().default(""),
  items: z.array(cartItemSchema).min(1),
});

const beatInputSchema = z.object({
  title: z.string().min(1),
  bpm: z.number().int().min(0).max(400).default(0),
  musicalKey: z.string().default(""),
  genre: z.string().default("Hip-Hop"),
  mood: z.string().default(""),
  tags: z.string().default(""),
  artworkUrl: z.string().default(""),
  audioUrl: z.string().default(""),
  // delivery files per tier: { mp3, wav, unlimited, exclusive }
  fileUrls: z.record(z.string(), z.string()).default({}),
  priceFrom: z.number().int().min(0).default(2400),
  soldExclusive: z.boolean().default(false),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

function makeSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "beat"}-${id.slice(-4)}`;
}

/**
 * If the stored value is an S3 object key (not an http URL), return a
 * presigned GET url. Otherwise return it untouched (supports external URLs too).
 */
/** Shape a beat row for public consumption: sign artwork + preview audio. */
async function publicBeat<T extends { artworkUrl: string; audioUrl: string }>(b: T): Promise<T> {
  return { ...b, artworkUrl: await signIfKey(b.artworkUrl), audioUrl: await signIfKey(b.audioUrl) };
}

async function signIfKey(key: string): Promise<string> {
  if (!key) return "";
  try {
    return await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
  } catch (e) {
    // Log the S3 error so we can diagnose signing/fetch issues in production
    try {
      console.error("[s3] signIfKey failed", { key, error: e });
    } catch {
      // ignore logging failures
    }
    return "";
  }
}

const SETTINGS_ID = "site";

async function loadSettings(): Promise<SiteSettings> {
  // The settings table might not exist yet in some environments (fresh DB/migrations not run).
  // Wrap the DB access in try/catch so the app still boots even if migrations weren't applied.
  try {
    const rows = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).limit(1);
    if (rows.length === 0) return mergeSettings(null);
    try {
      return mergeSettings(JSON.parse(rows[0].json || "{}"));
    } catch {
      return mergeSettings(null);
    }
  } catch (e) {
    console.error("[db] loadSettings failed (table may be missing)", e);
    return mergeSettings(null);
  }
}

/** Sign any brand asset urls that are stored S3 keys (uploads); pass through absolute/default (/brand/*) paths untouched. */
async function signBrandUrl(value: string): Promise<string> {
  if (!value || value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return signIfKey(value);
}

async function publicSettings(s: SiteSettings) {
  return {
    ...s,
    brand: {
      squareLogoUrl: await signBrandUrl(s.brand.squareLogoUrl),
      fullLogoUrl: await signBrandUrl(s.brand.fullLogoUrl),
      faviconUrl: await signBrandUrl(s.brand.faviconUrl),
    },
  };
}

const settingsSchema = z.object({
  theme: z
    .object({
      primary: z.string(),
      primaryBright: z.string(),
      primaryDeep: z.string(),
      background: z.string(),
      surface: z.string(),
      surfaceHover: z.string(),
      text: z.string(),
      muted: z.string(),
    })
    .partial()
    .optional(),
  fontId: z.string().optional(),
  brand: z
    .object({
      squareLogoUrl: z.string(),
      fullLogoUrl: z.string(),
      faviconUrl: z.string(),
    })
    .partial()
    .optional(),
});

const app = new Hono()
  .basePath("api")
  .use(
    cors({
      origin: (origin) => origin ?? "*",
      credentials: true,
      exposeHeaders: ["set-auth-token"],
    }),
  )
  .get("/health", (c) => c.json({ status: "ok" }, 200))

  // ---- Site settings (public — theme/font/brand for re-skin) ----
  .get("/settings", async (c) => {
    const s = await loadSettings();
    return c.json({ settings: await publicSettings(s) }, 200);
  })

  // ---- Beats ----
  .get("/beats", async (c) => {
    const all = await db
      .select()
      .from(beats)
      .where(eq(beats.published, true))
      .orderBy(desc(beats.featured), desc(beats.createdAt));
    return c.json({ beats: await Promise.all(all.map(publicBeat)) }, 200);
  })
  .get("/beats/featured", async (c) => {
    const list = await db
      .select()
      .from(beats)
      .where(and(eq(beats.published, true), eq(beats.featured, true)))
      .orderBy(desc(beats.createdAt));
    return c.json({ beats: await Promise.all(list.map(publicBeat)) }, 200);
  })
  .get("/beats/:slug", async (c) => {
    const slug = c.req.param("slug");
    const rows = await db.select().from(beats).where(eq(beats.slug, slug)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    return c.json({ beat: await publicBeat(rows[0]) }, 200);
  })
  .post("/beats/:id/play", async (c) => {
    const id = c.req.param("id");
    const rows = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    await db
      .update(beats)
      .set({ plays: (rows[0].plays ?? 0) + 1 })
      .where(eq(beats.id, id));
    return c.json({ ok: true }, 200);
  })

  // ---- Checkout ----
  .post("/checkout", zValidator("json", checkoutSchema), async (c) => {
    const body = c.req.valid("json");

    // Resolve line items + price server-side (never trust client prices)
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
      let files: Record<string, string> = {};
      try {
        files = JSON.parse(beat.fileUrls || "{}");
      } catch {
        files = {};
      }
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
    const downloadToken = rid("dl") + rid("tk");

    // Free-only orders: skip Stripe, mark paid immediately
    const allFree = totalCents === 0;

    await db.insert(orders).values({
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
      await db.insert(orderItems).values({
        id: rid("item"),
        orderId,
        beatId: item.beatId,
        beatTitle: item.beatTitle,
