import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import type { Hono } from "hono";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { db } from "../database";
import { beats, orders, orderItems, subscribers, settings } from "../database/schema";
import { requireAdmin, checkPassword, makeAdminToken } from "../lib/admin-auth";
import {
  loadSettings,
  publicSettings,
  invalidateSettingsCache,
  SETTINGS_ID,
} from "../lib/settings";
import { mergeSettings } from "../../shared/site-settings";
import { rid, makeSlug } from "../lib/util";
import { signIfKey, normalizeKey } from "../lib/url-sign";
import { s3, S3_BUCKET, S3_CONFIGURED } from "../lib/s3";

const beatInputSchema = z.object({
  title: z.string().min(1),
  bpm: z.number().int().min(0).max(400).default(0),
  musicalKey: z.string().default(""),
  genre: z.string().default("Hip-Hop"),
  mood: z.string().default(""),
  tags: z.string().default(""),
  artworkUrl: z.string().default(""),
  audioUrl: z.string().default(""),
  fileUrls: z.record(z.string(), z.string()).default({}),
  priceFrom: z.number().int().min(0).default(2400),
  soldExclusive: z.boolean().default(false),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

// Keep PATCH-style updates free of field defaults. Applying `.partial()` to the
// create schema would allow its media defaults to replace omitted artwork/audio
// fields when an admin only changes `featured` or `published`.
const beatUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  bpm: z.number().int().min(0).max(400).optional(),
  musicalKey: z.string().optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  tags: z.string().optional(),
  artworkUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  fileUrls: z.record(z.string(), z.string()).optional(),
  priceFrom: z.number().int().min(0).optional(),
  soldExclusive: z.boolean().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

const PAGE_BUILDER_IMAGE_FOLDER = "site-builder/images";
const PAGE_BUILDER_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const PAGE_BUILDER_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const uploadPresignSchema = z.object({
  filename: z.string().min(1).max(180),
  contentType: z.string().min(1).max(120),
  folder: z.string().min(1).max(120).optional(),
  size: z
    .number()
    .int()
    .positive()
    .max(250 * 1024 * 1024)
    .optional(),
});

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
  header: z
    .object({
      showWordmark: z.boolean(),
      sticky: z.boolean(),
      transparentAtTop: z.boolean(),
      showCart: z.boolean(),
      showSocialLinks: z.boolean(),
      ctaLabel: z.string().max(80).optional(),
      ctaHref: z.string().max(2000).optional(),
    })
    .partial()
    .optional(),
  footer: z
    .object({
      description: z.string().max(1000),
      contactEmail: z.string().email(),
      showNavigation: z.boolean(),
      showNewsletter: z.boolean(),
      newsletterHeading: z.string().max(100),
      newsletterButton: z.string().max(80),
      legalLine: z.string().max(200),
    })
    .partial()
    .optional(),
  newsletterPopup: z
    .object({
      enabled: z.boolean(),
      delayMs: z.number().int().min(0).max(60_000),
      showOnce: z.boolean(),
      homeOnly: z.boolean(),
      title: z.string().max(120),
      body: z.string().max(500),
      placeholder: z.string().max(120),
      buttonLabel: z.string().max(80),
      dismissLabel: z.string().max(80),
      successMessage: z.string().max(240),
      consentText: z.string().max(240),
    })
    .partial()
    .optional(),
  socials: z
    .array(
      z.object({
        id: z.string(),
        platform: z.enum([
          "instagram",
          "tiktok",
          "youtube",
          "spotify",
          "soundcloud",
          "facebook",
          "x",
          "custom",
        ]),
        label: z.string().max(80),
        url: z.string().url().max(2000),
        showInHeader: z.boolean().optional(),
        showInFooter: z.boolean().optional(),
      }),
    )
    .max(20)
    .optional(),
  pages: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string().regex(/^[a-z0-9-]+$/),
        path: z.string().startsWith("/").max(200).optional(),
        title: z.string(),
        navLabel: z.string(),
        published: z.boolean(),
        showInNav: z.boolean(),
        showInFooter: z.boolean().optional(),
        navOrder: z.number().int().min(0).max(10000).optional(),
        isSystem: z.boolean().optional(),
        layout: z
          .object({
            showHeader: z.boolean().optional(),
            showFooter: z.boolean().optional(),
            background: z.enum(["default", "mesh", "ink"]).optional(),
          })
          .optional(),
        seo: z
          .object({
            title: z.string().max(70).optional(),
            description: z.string().max(200).optional(),
            canonicalPath: z.string().startsWith("/").max(200).optional(),
            ogImageUrl: z.string().max(2000).optional(),
            noIndex: z.boolean().optional(),
          })
          .optional(),
        sections: z.array(
          z.object({
            id: z.string(),
            type: z.enum([
              "hero",
              "text",
              "image",
              "video",
              "gallery",
              "featureCards",
              "callout",
              "marquee",
              "divider",
              "spacer",
              "pressKit",
              "merch",
              "featuredBeats",
              "beatCatalog",
              "licenseTiers",
              "licenseComparison",
            ]),
            eyebrow: z.string().optional(),
            title: z.string().optional(),
            body: z.string().optional(),
            imageUrl: z.string().optional(),
            videoUrl: z.string().optional(),
            ctaLabel: z.string().optional(),
            ctaHref: z.string().optional(),
            secondaryCtaLabel: z.string().optional(),
            secondaryCtaHref: z.string().optional(),
            collection: z.string().optional(),
            anchorId: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/).max(80).optional(),
            customClass: z.string().max(120).optional(),
            ariaLabel: z.string().max(120).optional(),
            items: z
              .array(
                z.object({
                  id: z.string(),
                  title: z.string(),
                  body: z.string().optional(),
                  imageUrl: z.string().optional(),
                  href: z.string().optional(),
                  label: z.string().optional(),
                }),
              )
              .max(24)
              .optional(),
            layout: z
              .object({
                width: z.enum(["narrow", "standard", "wide", "full"]).optional(),
                spacing: z.enum(["tight", "normal", "relaxed", "cinematic"]).optional(),
                alignment: z.enum(["left", "center", "right"]).optional(),
                surface: z.enum(["transparent", "ink", "mesh", "accent", "bordered"]).optional(),
                columns: z
                  .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
                  .optional(),
                mediaPosition: z.enum(["none", "left", "right", "background", "top"]).optional(),
                mediaFit: z.enum(["cover", "contain"]).optional(),
                mediaAspect: z.enum(["auto", "square", "wide", "portrait", "cinema"]).optional(),
                imageOverlay: z.enum(["none", "soft", "strong"]).optional(),
                borderRadius: z.enum(["none", "soft", "rounded"]).optional(),
                emphasis: z.enum(["standard", "accent", "muted"]).optional(),
              })
              .optional(),
          }),
        ),
      }),
    )
    .optional(),
  fourthwall: z
    .object({
      shopDomain: z.string(),
      defaultCollection: z.string(),
      currency: z.string().length(3),
    })
    .partial()
    .optional(),
  builder: z
    .object({
      drafts: z
        .array(
          z.object({
            id: z.string(),
            pageId: z.string(),
            updatedAt: z.string(),
            snapshot: z.record(z.string(), z.unknown()),
          }),
        )
        .max(20)
        .optional(),
      templates: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().min(1).max(80),
            description: z.string().max(240).optional(),
            createdAt: z.string(),
            updatedAt: z.string(),
            sections: z.array(z.record(z.string(), z.unknown())).max(24),
          }),
        )
        .max(30)
        .optional(),
      versions: z
        .array(
          z.object({
            id: z.string(),
            pageId: z.string(),
            label: z.string().min(1).max(100),
            createdAt: z.string(),
            snapshot: z.record(z.string(), z.unknown()),
          }),
        )
        .max(50)
        .optional(),
    })
    .partial()
    .optional(),
});

function normalizeFileUrls(files: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(files || {})) out[k] = normalizeKey(v);
  return out;
}

export function adminRoutes(app: Hono) {
  app.post("/admin/login", zValidator("json", z.object({ password: z.string() })), async (c) => {
    const { password } = c.req.valid("json");
    if (!checkPassword(password)) {
      return c.json({ error: "invalid_password" }, 401);
    }
    return c.json({ token: makeAdminToken() }, 200);
  });

  app.get("/admin/me", requireAdmin, (c) => c.json({ ok: true }, 200));

  app.post(
    "/admin/upload/presign",
    requireAdmin,
    zValidator("json", uploadPresignSchema),
    async (c) => {
      const { filename, contentType, folder, size } = c.req.valid("json");
      if (folder === PAGE_BUILDER_IMAGE_FOLDER) {
        if (!PAGE_BUILDER_IMAGE_TYPES.has(contentType.toLowerCase())) {
          return c.json(
            {
              error: "unsupported_image_type",
              message: "Use a JPG, PNG, WebP, GIF, or AVIF image.",
            },
            415,
          );
        }
        if (!size || size > PAGE_BUILDER_IMAGE_MAX_BYTES) {
          return c.json(
            { error: "image_too_large", message: "Page Builder images must be 10 MB or smaller." },
            413,
          );
        }
      }
      if (!S3_CONFIGURED) {
        return c.json(
          {
            error: "storage_not_configured",
            message:
              "Object storage is not configured. Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (or the S3_* equivalents) on the server.",
          },
          503,
        );
      }
      const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `${folder || "uploads"}/${Date.now()}-${randomUUID()}-${safe}`;
      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType }),
        { expiresIn: 600 },
      );
      return c.json({ url, key }, 200);
    },
  );

  app.get("/admin/beats", requireAdmin, async (c) => {
    const all = await db.select().from(beats).orderBy(desc(beats.createdAt));
    const withUrls = await Promise.all(
      all.map(async (b) => ({
        ...b,
        // NOTE: never overwrite the raw keys here — the edit form saves these
        // values straight back, and persisting a presigned url corrupts the row.
        artworkSignedUrl: await signIfKey(b.artworkUrl),
        audioSignedUrl: await signIfKey(b.audioUrl),
      })),
    );
    return c.json({ beats: withUrls }, 200);
  });

  app.get("/admin/beats/:id", requireAdmin, async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "invalid_beat_id" }, 400);
    const rows = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
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
  });

  app.post("/admin/beats", requireAdmin, zValidator("json", beatInputSchema), async (c) => {
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
      artworkUrl: normalizeKey(input.artworkUrl),
      audioUrl: normalizeKey(input.audioUrl),
      fileUrls: JSON.stringify(normalizeFileUrls(input.fileUrls)),
      priceFrom: input.priceFrom ?? 2400,
      soldExclusive: input.soldExclusive ?? false,
      featured: input.featured ?? false,
      published: input.published ?? true,
    });
    return c.json({ id, slug }, 200);
  });

  app.put("/admin/beats/:id", requireAdmin, zValidator("json", beatUpdateSchema), async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "invalid_beat_id" }, 400);
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
    if (input.artworkUrl !== undefined) patch.artworkUrl = normalizeKey(input.artworkUrl);
    if (input.audioUrl !== undefined) patch.audioUrl = normalizeKey(input.audioUrl);
    if (input.fileUrls !== undefined)
      patch.fileUrls = JSON.stringify(normalizeFileUrls(input.fileUrls));
    if (input.priceFrom !== undefined) patch.priceFrom = input.priceFrom;
    if (input.soldExclusive !== undefined) patch.soldExclusive = input.soldExclusive;
    if (input.featured !== undefined) patch.featured = input.featured;
    if (input.published !== undefined) patch.published = input.published;
    await db.update(beats).set(patch).where(eq(beats.id, id));
    return c.json({ ok: true }, 200);
  });

  app.delete("/admin/beats/:id", requireAdmin, async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "invalid_beat_id" }, 400);
    await db.delete(beats).where(eq(beats.id, id));
    return c.json({ ok: true }, 200);
  });

  app.get("/admin/orders", requireAdmin, async (c) => {
    const rows = await db
      .select({ order: orders, item: orderItems })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .orderBy(desc(orders.createdAt))
      .limit(200);
    type OrderWithItems = typeof orders.$inferSelect & {
      items: (typeof orderItems.$inferSelect)[];
    };
    const byId = new Map<string, OrderWithItems>();
    for (const { order, item } of rows) {
      let entry = byId.get(order.id);
      if (!entry) {
        entry = { ...order, items: [] };
        byId.set(order.id, entry);
      }
      if (item) entry.items.push(item);
    }
    return c.json({ orders: [...byId.values()] }, 200);
  });

  app.get("/admin/subscribers", requireAdmin, async (c) => {
    const all = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
    return c.json({ subscribers: all }, 200);
  });

  app.get("/admin/settings", requireAdmin, async (c) => {
    const s = await loadSettings();
    const preview = await publicSettings(s);
    return c.json({ settings: s, preview }, 200);
  });

  app.put("/admin/settings", requireAdmin, zValidator("json", settingsSchema), async (c) => {
    const input = c.req.valid("json");
    const current = await loadSettings();
    const merged = mergeSettings({
      theme: { ...current.theme, ...input.theme },
      fontId: input.fontId ?? current.fontId,
      brand: { ...current.brand, ...input.brand },
      header: { ...current.header, ...input.header },
      footer: { ...current.footer, ...input.footer },
      newsletterPopup: { ...current.newsletterPopup, ...input.newsletterPopup },
      socials: input.socials ?? current.socials,
      pages: input.pages ?? current.pages,
      fourthwall: { ...current.fourthwall, ...input.fourthwall },
      builder: input.builder
        ? {
            drafts: input.builder.drafts ?? current.builder.drafts,
            templates: input.builder.templates ?? current.builder.templates,
            versions: input.builder.versions ?? current.builder.versions,
          }
        : current.builder,
    });
    const json = JSON.stringify(merged);
    const existing = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).limit(1);
    if (existing.length === 0) {
      await db.insert(settings).values({ id: SETTINGS_ID, json });
    } else {
      await db
        .update(settings)
        .set({ json, updatedAt: new Date().toISOString() })
        .where(eq(settings.id, SETTINGS_ID));
    }
    invalidateSettingsCache();
    return c.json({ settings: merged }, 200);
  });

  app.post("/admin/settings/reset", requireAdmin, async (c) => {
    const merged = mergeSettings(null);
    const json = JSON.stringify(merged);
    const existing = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).limit(1);
    if (existing.length === 0) {
      await db.insert(settings).values({ id: SETTINGS_ID, json });
    } else {
      await db
        .update(settings)
        .set({ json, updatedAt: new Date().toISOString() })
        .where(eq(settings.id, SETTINGS_ID));
    }
    invalidateSettingsCache();
    return c.json({ settings: merged }, 200);
  });

  app.get("/admin/stats", requireAdmin, async (c) => {
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
}
