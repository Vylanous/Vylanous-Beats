import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import Stripe from "stripe";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "./database";
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
  // Serve license PDFs explicitly before SPA fallback
app.use('/licenses/*', serveStatic({ root: './public' }))
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
        licenseTier: item.tier,
        licenseName: item.licenseName,
        priceCents: item.priceCents,
        fileUrl: item.fileUrl,
      });
    }

    if (allFree) {
      await sendDeliveryEmail(body.email, orderId, downloadToken).catch((e) =>
        console.error("[email] free order", e),
      );
      return c.json(
        { mode: "free", orderId, token: downloadToken, url: `/success?order=${orderId}&token=${downloadToken}` },
        200,
      );
    }

    // Paid: create Stripe Checkout session
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
  })

  // ---- Confirm payment (called on success page) ----
  .post("/orders/:id/confirm", async (c) => {
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
          await db
            .update(orders)
            .set({ status: "paid", paidAt: new Date().toISOString() })
            .where(eq(orders.id, id));
          order.status = "paid";
          // mark exclusives as sold
          const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
          for (const it of items) {
            if (it.licenseTier === "exclusive") {
              await db.update(beats).set({ soldExclusive: true, published: false }).where(eq(beats.id, it.beatId));
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
  })

  // ---- Get order + download links (token-gated) ----
  .get("/orders/:id", async (c) => {
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
            // only expose download when paid; sign S3 keys so links work
            downloadUrl: unlocked ? await signIfKey(i.fileUrl) : null,
          })),
        ),
        unlocked,
      },
      200,
    );
  })

  // ---- Newsletter ----
  .post("/subscribe", zValidator("json", z.object({ email: z.string().email() })), async (c) => {
    const { email } = c.req.valid("json");
    const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
    if (existing.length === 0) {
      await db.insert(subscribers).values({ id: rid("sub"), email });
    }
    return c.json({ ok: true }, 200);
  })

  // ========================================================================
  // ADMIN — single-owner dashboard (password gated)
  // ========================================================================

  // ---- Login: exchange password for a token ----
  .post("/admin/login", zValidator("json", z.object({ password: z.string() })), async (c) => {
    const { password } = c.req.valid("json");
    if (!checkPassword(password)) {
      return c.json({ error: "invalid_password" }, 401);
    }
    return c.json({ token: makeAdminToken() }, 200);
  })

  // ---- Verify token still valid (for app boot) ----
  .get("/admin/me", requireAdmin, (c) => c.json({ ok: true }, 200))

  // ---- Presign an upload URL (artwork / preview / delivery files) ----
  .post(
    "/admin/upload/presign",
    requireAdmin,
    zValidator(
      "json",
      z.object({ filename: z.string(), contentType: z.string(), folder: z.string().optional() }),
    ),
    async (c) => {
      const { filename, contentType, folder } = c.req.valid("json");
      const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `${folder || "uploads"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType }),
        { expiresIn: 600 },
      );
      return c.json({ url, key }, 200);
    },
  )

  // ---- List ALL beats (incl. unpublished/sold) for the dashboard ----
  .get("/admin/beats", requireAdmin, async (c) => {
    const all = await db.select().from(beats).orderBy(desc(beats.createdAt));
    // sign artwork/audio so previews work in the dashboard
    const withUrls = await Promise.all(
      all.map(async (b) => ({
        ...b,
        artworkUrl: await signIfKey(b.artworkUrl),
        audioUrl: await signIfKey(b.audioUrl),
      })),
    );
    return c.json({ beats: withUrls }, 200);
  })

  // ---- Get single beat (raw, for editing) ----
  .get("/admin/beats/:id", requireAdmin, async (c) => {
    const rows = await db.select().from(beats).where(eq(beats.id, c.req.param("id"))).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    const b = rows[0];
    return c.json(
      {
        beat: {
          ...b,
          artworkSignedUrl: await signIfKey(b.artworkUrl),
          audioSignedUrl: await signIfKey(b.audioUrl),
        },
      },
      200,
    );
  })

  // ---- Create beat ----
  .post("/admin/beats", requireAdmin, zValidator("json", beatInputSchema), async (c) => {
    const input = c.req.valid("json");
    const id = rid("beat");
    const slug = makeSlug(input.title, id);
    await db.insert(beats).values({
      id,
      title: input.title,
      slug,
      bpm: input.bpm,
      musicalKey: input.musicalKey,
      genre: input.genre || "Hip-Hop",
      mood: input.mood,
      tags: input.tags,
      artworkUrl: input.artworkUrl,
      audioUrl: input.audioUrl,
      fileUrls: JSON.stringify(input.fileUrls || {}),
      priceFrom: input.priceFrom ?? 2400,
      soldExclusive: input.soldExclusive ?? false,
      featured: input.featured ?? false,
      published: input.published ?? true,
    });
    return c.json({ id, slug }, 200);
  })

  // ---- Update beat ----
  .put("/admin/beats/:id", requireAdmin, zValidator("json", beatInputSchema.partial()), async (c) => {
    const id = c.req.param("id");
    const rows = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    const input = c.req.valid("json");
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.bpm !== undefined) patch.bpm = input.bpm;
    if (input.musicalKey !== undefined) patch.musicalKey = input.musicalKey;
    if (input.genre !== undefined) patch.genre = input.genre;
    if (input.mood !== undefined) patch.mood = input.mood;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.artworkUrl !== undefined) patch.artworkUrl = input.artworkUrl;
    if (input.audioUrl !== undefined) patch.audioUrl = input.audioUrl;
    if (input.fileUrls !== undefined) patch.fileUrls = JSON.stringify(input.fileUrls);
    if (input.priceFrom !== undefined) patch.priceFrom = input.priceFrom;
    if (input.soldExclusive !== undefined) patch.soldExclusive = input.soldExclusive;
    if (input.featured !== undefined) patch.featured = input.featured;
    if (input.published !== undefined) patch.published = input.published;
    await db.update(beats).set(patch).where(eq(beats.id, id));
    return c.json({ ok: true }, 200);
  })

  // ---- Delete beat ----
  .delete("/admin/beats/:id", requireAdmin, async (c) => {
    await db.delete(beats).where(eq(beats.id, c.req.param("id")));
    return c.json({ ok: true }, 200);
  })

  // ---- Orders list ----
  .get("/admin/orders", requireAdmin, async (c) => {
    const all = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
    const withItems = await Promise.all(
      all.map(async (o) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
        return { ...o, items };
      }),
    );
    return c.json({ orders: withItems }, 200);
  })

  // ---- Subscribers list ----
  .get("/admin/subscribers", requireAdmin, async (c) => {
    const all = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
    return c.json({ subscribers: all }, 200);
  })

  // ---- Site customization (re-skin: colors, font pairing, brand assets) ----
  .get("/admin/settings", requireAdmin, async (c) => {
    const s = await loadSettings();
    // settings.brand.* stay raw (S3 key or default /brand path) — the source of truth for saving.
    // preview.* are signed/display-ready urls for the admin panel's thumbnails only.
    const preview = (await publicSettings(s)).brand;
    return c.json({ settings: s, preview }, 200);
  })
  .put("/admin/settings", requireAdmin, zValidator("json", settingsSchema), async (c) => {
    const input = c.req.valid("json");
    const current = await loadSettings();
    const merged = mergeSettings({
      theme: { ...current.theme, ...input.theme },
      fontId: input.fontId ?? current.fontId,
      brand: { ...current.brand, ...input.brand },
    });
    const json = JSON.stringify(merged);
    const existing = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).limit(1);
    if (existing.length === 0) {
      await db.insert(settings).values({ id: SETTINGS_ID, json });
    } else {
      await db.update(settings).set({ json, updatedAt: new Date().toISOString() }).where(eq(settings.id, SETTINGS_ID));
    }
    return c.json({ settings: merged }, 200);
  })
  .post("/admin/settings/reset", requireAdmin, async (c) => {
    const merged = mergeSettings(null);
    const json = JSON.stringify(merged);
    const existing = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).limit(1);
    if (existing.length === 0) {
      await db.insert(settings).values({ id: SETTINGS_ID, json });
    } else {
      await db.update(settings).set({ json, updatedAt: new Date().toISOString() }).where(eq(settings.id, SETTINGS_ID));
    }
    return c.json({ settings: merged }, 200);
  })

  // ---- Stats ----
  .get("/admin/stats", requireAdmin, async (c) => {
    const allBeats = await db.select().from(beats);
    const allOrders = await db.select().from(orders);
    const subs = await db.select().from(subscribers);
    const paid = allOrders.filter((o) => o.status === "paid");
    const revenueCents = paid.reduce((s, o) => s + o.totalCents, 0);
    return c.json(
      {
        beats: allBeats.length,
        published: allBeats.filter((b) => b.published).length,
        orders: allOrders.length,
        paidOrders: paid.length,
        revenueCents,
        subscribers: subs.length,
      },
      200,
    );
  });

export type AppType = typeof app;
export default app;

// --- helpers ---

async function sendDeliveryEmail(email: string, orderId: string, token: string) {
  const base = appUrl();
  const link = `${base}/success?order=${orderId}&token=${token}`;
  // Use platform send-email CLI if available
  try {
    const proc = Bun.spawn(
      [
        "send-email",
        "--to",
        email,
        "--subject",
        "Your Vylanous Beats download is ready",
        "--html",
        `<div style="font-family:sans-serif;background:#0a0a0c;color:#edeef2;padding:32px;border-radius:12px">
          <h1 style="color:#a24df5;letter-spacing:1px">VYLANOUS BEATS</h1>
          <p>Thanks for your purchase. Your beats are ready to download.</p>
          <p><a href="${link}" style="background:#7c2fcb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Download your beats</a></p>
          <p style="color:#7a7c88;font-size:13px">Order ${orderId}. Keep this email — your download link is private.</p>
        </div>`,
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    await proc.exited;
  } catch (e) {
    console.error("[email] send failed", e);
  }
}
