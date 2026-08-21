import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import type { Hono } from "hono";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { db } from "../database";
import {
  beats,
  orders,
  orderItems,
  subscribers,
  settings,
} from "../database/schema";
import { requireAdmin, checkPassword, makeAdminToken } from "../lib/admin-auth";
import {
  loadSettings,
  publicSettings,
  invalidateSettingsCache,
  SETTINGS_ID,
} from "../lib/settings";
import { BUILDER_FONT_IDS, mergeSettings } from "../../shared/site-settings";
import { rid, makeSlug } from "../lib/util";
import { signIfKey, normalizeKey } from "../lib/url-sign";
import { s3, S3_BUCKET, S3_CONFIGURED } from "../lib/s3";

type MediaHealthStatus =
  "healthy" | "missing" | "broken" | "external" | "public" | "unavailable";
type MediaHealthEntry = {
  id: string;
  source: string;
  kind: "image" | "video" | "audio" | "file";
  reference: string;
  normalizedKey?: string;
  status: MediaHealthStatus;
  detail: string;
};

function addMediaReference(
  entries: Omit<MediaHealthEntry, "status" | "detail">[],
  id: string,
  source: string,
  kind: MediaHealthEntry["kind"],
  reference: unknown,
) {
  if (typeof reference !== "string" || !reference.trim()) return;
  entries.push({ id, source, kind, reference: reference.trim() });
}

async function probeMediaReference(
  entry: Omit<MediaHealthEntry, "status" | "detail">,
): Promise<MediaHealthEntry> {
  const reference = entry.reference;
  if (/^https?:\/\//i.test(reference)) {
    return {
      ...entry,
      status: "external",
      detail: "External URL; not probed by the server.",
    };
  }
  if (reference.startsWith("/")) {
    return { ...entry, status: "public", detail: "Public site asset path." };
  }
  const normalizedKey = normalizeKey(reference);
  if (!normalizedKey) {
    return {
      ...entry,
      status: "missing",
      detail: "The stored media reference is empty.",
    };
  }
  if (!S3_CONFIGURED) {
    return {
      ...entry,
      normalizedKey,
      status: "unavailable",
      detail: "Object storage is not configured in this environment.",
    };
  }
  try {
    await s3.send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: normalizedKey }),
    );
    return {
      ...entry,
      normalizedKey,
      status: "healthy",
      detail: "Object exists in storage.",
    };
  } catch (error) {
    const code =
      error && typeof error === "object" && "$metadata" in error
        ? "Storage HEAD request failed."
        : "Object was not found in storage.";
    return { ...entry, normalizedKey, status: "broken", detail: code };
  }
}

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
const PAGE_BUILDER_VIDEO_FOLDER = "site-builder/videos";
const PAGE_BUILDER_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const PAGE_BUILDER_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const PAGE_BUILDER_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
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
  announcementBanner: z
    .object({
      enabled: z.boolean(),
      message: z.string().max(240),
      ctaLabel: z.string().max(80),
      ctaHref: z.string().max(2000),
      tone: z.enum(["accent", "sale", "notice"]),
      target: z.enum(["all", "selected"]),
      pageIds: z.array(z.string().max(120)).max(60),
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
        parentPageId: z.string().max(120).optional(),
        title: z.string(),
        navLabel: z.string(),
        published: z.boolean(),
        showInNav: z.boolean(),
        showInFooter: z.boolean().optional(),
        showChildNavigation: z.boolean().optional(),
        navOrder: z.number().int().min(0).max(10000).optional(),
        isSystem: z.boolean().optional(),
        layout: z
          .object({
            showHeader: z.boolean().optional(),
            showFooter: z.boolean().optional(),
            background: z.enum(["default", "mesh", "ink"]).optional(),
            inheritTheme: z.boolean().optional(),
            primaryColor: z
              .string()
              .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
              .optional(),
            backgroundColor: z
              .string()
              .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
              .optional(),
            textColor: z
              .string()
              .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
              .optional(),
            mutedColor: z
              .string()
              .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
              .optional(),
            surfaceColor: z
              .string()
              .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
              .optional(),
            borderColor: z
              .string()
              .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
              .optional(),
            backgroundImage: z.string().max(2000).optional(),
            backgroundImageFit: z.enum(["cover", "contain", "tile"]).optional(),
            backgroundImagePosition: z
              .enum(["center", "top", "bottom", "left", "right"])
              .optional(),
            backgroundOverlay: z
              .enum(["none", "soft", "medium", "strong"])
              .optional(),
            pageTreatment: z
              .enum(["none", "grain", "grid", "spotlight"])
              .optional(),
            pageFont: z.enum(BUILDER_FONT_IDS).optional(),
            contentWidth: z
              .enum(["narrow", "standard", "wide", "full"])
              .optional(),
            sectionSpacing: z
              .enum(["tight", "normal", "relaxed", "cinematic"])
              .optional(),
            eyebrowColor: z
              .string()
              .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
              .optional(),
            linkColor: z
              .string()
              .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
              .optional(),
            wordmark: z.string().max(120).optional(),
            headerLogoUrl: z.string().max(2000).optional(),
            headerLabel: z.string().max(120).optional(),
            headerLogoHref: z.string().max(500).optional(),
            footerLogoUrl: z.string().max(2000).optional(),
            footerLabel: z.string().max(120).optional(),
            wordmarkAccent: z.string().max(80).optional(),
            wordmarkAccentColor: z
              .string()
              .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
              .optional(),
            chrome: z
              .object({
                header: z.boolean().optional(),
                navigation: z.boolean().optional(),
                footer: z.boolean().optional(),
              })
              .optional(),
            headerActions: z
              .object({
                showVault: z.boolean().optional(),
                vaultLabel: z.string().max(80).optional(),
                vaultHref: z.string().max(500).optional(),
                showSignIn: z.boolean().optional(),
                signInLabel: z.string().max(80).optional(),
                signInHref: z.string().max(500).optional(),
                showCart: z.boolean().optional(),
              })
              .optional(),
            headerSocialIds: z.array(z.string().max(120)).max(32).optional(),
            footerSocialIds: z.array(z.string().max(120)).max(32).optional(),
            pageSocialLinks: z
              .array(
                z.object({
                  id: z.string().max(120),
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
                  url: z.string().max(2000),
                  showInHeader: z.boolean().optional(),
                  showInFooter: z.boolean().optional(),
                }),
              )
              .max(32)
              .optional(),
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
            body: z.string().max(12_000).optional(),
            bodyFormat: z.enum(["plain", "inline"]).optional(),
            imageUrl: z.string().optional(),
            videoUrl: z.string().optional(),
            coverImageUrl: z.string().optional(),
            coverVideoUrl: z.string().optional(),
            coverOverlay: z.enum(["none", "soft", "strong"]).optional(),
            ctaLabel: z.string().optional(),
            ctaHref: z.string().optional(),
            secondaryCtaLabel: z.string().optional(),
            secondaryCtaHref: z.string().optional(),
            collection: z.string().optional(),
            anchorId: z
              .string()
              .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
              .max(80)
              .optional(),
            customClass: z.string().max(120).optional(),
            ariaLabel: z.string().max(120).optional(),
            sectionLogoUrl: z.string().max(2000).optional(),
            sectionLogoAlt: z.string().max(160).optional(),
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
            pressKit: z
              .object({
                updatedAt: z.string().max(80).optional(),
                sourceNote: z.string().max(240).optional(),
                metrics: z
                  .array(
                    z.object({
                      id: z.string().max(80),
                      platform: z.enum([
                        "youtube",
                        "tiktok",
                        "instagram",
                        "facebook",
                        "spotify",
                        "soundcloud",
                        "x",
                        "website",
                        "other",
                      ]),
                      label: z.string().max(80).optional(),
                      handle: z.string().max(120).optional(),
                      followers: z
                        .number()
                        .min(0)
                        .max(10_000_000_000)
                        .optional(),
                      subscribers: z
                        .number()
                        .min(0)
                        .max(10_000_000_000)
                        .optional(),
                      videos: z
                        .number()
                        .int()
                        .min(0)
                        .max(10_000_000)
                        .optional(),
                      posts: z.number().int().min(0).max(10_000_000).optional(),
                      views: z
                        .number()
                        .min(0)
                        .max(10_000_000_000_000)
                        .optional(),
                      likes: z
                        .number()
                        .min(0)
                        .max(10_000_000_000_000)
                        .optional(),
                      engagementRate: z.number().min(0).max(100).optional(),
                      url: z.string().max(2000).optional(),
                    }),
                  )
                  .max(24),
                audience: z.object({
                  gender: z
                    .array(
                      z.object({
                        label: z.string().max(80),
                        value: z.number().min(0).max(100),
                      }),
                    )
                    .max(12)
                    .optional(),
                  age: z
                    .array(
                      z.object({
                        label: z.string().max(80),
                        value: z.number().min(0).max(100),
                      }),
                    )
                    .max(12)
                    .optional(),
                  locations: z
                    .array(
                      z.object({
                        label: z.string().max(120),
                        value: z.number().min(0).max(100),
                      }),
                    )
                    .max(24)
                    .optional(),
                  note: z.string().max(240).optional(),
                }),
              })
              .optional(),
            layout: z
              .object({
                width: z
                  .enum(["narrow", "standard", "wide", "full"])
                  .optional(),
                spacing: z
                  .enum(["tight", "normal", "relaxed", "cinematic"])
                  .optional(),
                alignment: z.enum(["left", "center", "right"]).optional(),
                surface: z
                  .enum(["transparent", "ink", "mesh", "accent", "bordered"])
                  .optional(),
                columns: z
                  .union([
                    z.literal(1),
                    z.literal(2),
                    z.literal(3),
                    z.literal(4),
                  ])
                  .optional(),
                mediaPosition: z
                  .enum(["none", "left", "right", "background", "top"])
                  .optional(),
                mediaFit: z.enum(["cover", "contain"]).optional(),
                mediaAspect: z
                  .enum(["auto", "square", "wide", "portrait", "cinema"])
                  .optional(),
                imageOverlay: z.enum(["none", "soft", "strong"]).optional(),
                borderRadius: z.enum(["none", "soft", "rounded"]).optional(),
                emphasis: z.enum(["standard", "accent", "muted"]).optional(),
                palette: z
                  .enum(["brand", "mono", "electric", "sunset", "forest"])
                  .optional(),
                headingScale: z
                  .enum(["compact", "standard", "display", "hero"])
                  .optional(),
                paddingX: z
                  .enum(["none", "tight", "normal", "wide"])
                  .optional(),
                shadow: z.enum(["none", "soft", "glow", "dramatic"]).optional(),
                borderStyle: z
                  .enum([
                    "none",
                    "subtle",
                    "accent",
                    "chrome",
                    "thin",
                    "double",
                    "dashed",
                    "gradient",
                    "neon",
                  ])
                  .optional(),
                glowColor: z
                  .string()
                  .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
                  .optional(),
                glowAnimation: z
                  .enum(["none", "move", "pulse", "slowFlash"])
                  .optional(),
                customColor: z
                  .string()
                  .regex(/^(?:|#[0-9A-Fa-f]{6})$/)
                  .optional(),
                fontFamily: z.enum(BUILDER_FONT_IDS).optional(),
                bodyFontFamily: z.enum(BUILDER_FONT_IDS).optional(),
                eyebrowSize: z
                  .enum(["12px", "14px", "16px", "18px", "20px"])
                  .optional(),
                headingSize: z
                  .enum([
                    "32px",
                    "40px",
                    "48px",
                    "56px",
                    "64px",
                    "72px",
                    "88px",
                    "104px",
                  ])
                  .optional(),
                bodySize: z
                  .enum(["14px", "16px", "18px", "20px", "22px", "24px"])
                  .optional(),
              })
              .optional(),
          }),
        ),
      }),
    )
    .optional(),
  deletedPageIds: z.array(z.string().max(120)).max(100).optional(),
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

function normalizeFileUrls(
  files: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(files || {})) {
    const normalized = normalizeKey(v);
    if (normalized) out[k.trim().toLowerCase()] = normalized;
  }
  return out;
}

function normalizeText(
  value: string | null | undefined,
  fallback = "",
): string {
  return (value || "").trim() || fallback;
}

function normalizeTags(value: string | null | undefined): string {
  return [
    ...new Set(
      (value || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].join(", ");
}

function normalizeBpm(value: number | null | undefined): number {
  const bpm = Number.isFinite(value) ? Math.round(value as number) : 0;
  return Math.min(400, Math.max(0, bpm));
}

function normalizePrice(value: number | null | undefined): number {
  const cents = Number.isFinite(value) ? Math.round(value as number) : 2400;
  return Math.max(0, cents);
}

function parseStoredFileUrls(
  raw: string | null | undefined,
): Record<string, string> {
  try {
    const parsed = JSON.parse(raw || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

function normalizeBeatMetadata(input: {
  title?: string | null;
  bpm?: number | null;
  musicalKey?: string | null;
  genre?: string | null;
  mood?: string | null;
  tags?: string | null;
  artworkUrl?: string | null;
  audioUrl?: string | null;
  fileUrls?: Record<string, string> | null;
  priceFrom?: number | null;
}) {
  return {
    title: normalizeText(input.title),
    bpm: normalizeBpm(input.bpm),
    musicalKey: normalizeText(input.musicalKey),
    genre: normalizeText(input.genre, "Hip-Hop"),
    mood: normalizeText(input.mood),
    tags: normalizeTags(input.tags),
    artworkUrl: normalizeKey(input.artworkUrl),
    audioUrl: normalizeKey(input.audioUrl),
    fileUrls: normalizeFileUrls(input.fileUrls || {}),
    priceFrom: normalizePrice(input.priceFrom),
  };
}

export function adminRoutes(app: Hono) {
  app.post(
    "/admin/login",
    zValidator("json", z.object({ password: z.string() })),
    async (c) => {
      const { password } = c.req.valid("json");
      if (!checkPassword(password)) {
        return c.json({ error: "invalid_password" }, 401);
      }
      return c.json({ token: makeAdminToken() }, 200);
    },
  );

  app.get("/admin/me", requireAdmin, (c) => c.json({ ok: true }, 200));

  app.post("/admin/upload", requireAdmin, async (c) => {
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
    const body = await c.req.parseBody();
    const uploaded = body.file;
    const file = uploaded instanceof File ? uploaded : null;
    const folder = typeof body.folder === "string" ? body.folder : "uploads";
    if (!file)
      return c.json(
        { error: "missing_file", message: "Choose a file to upload." },
        400,
      );
    if (!/^[a-zA-Z0-9/_-]+$/.test(folder) || folder.includes("..")) {
      return c.json(
        { error: "invalid_folder", message: "Invalid upload folder." },
        400,
      );
    }
    const contentType = file.type || "application/octet-stream";
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
      if (file.size > PAGE_BUILDER_IMAGE_MAX_BYTES) {
        return c.json(
          {
            error: "image_too_large",
            message: "Page Builder images must be 10 MB or smaller.",
          },
          413,
        );
      }
    }
    if (folder === PAGE_BUILDER_VIDEO_FOLDER) {
      if (!PAGE_BUILDER_VIDEO_TYPES.has(contentType.toLowerCase())) {
        return c.json(
          {
            error: "unsupported_video_type",
            message: "Use an MP4, WebM, or MOV video.",
          },
          415,
        );
      }
      if (file.size > PAGE_BUILDER_VIDEO_MAX_BYTES) {
        return c.json(
          {
            error: "video_too_large",
            message: "Page Builder cover videos must be 50 MB or smaller.",
          },
          413,
        );
      }
    }
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${folder}/${Date.now()}-${randomUUID()}-${safe}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: contentType,
      }),
    );
    return c.json({ key }, 200);
  });

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
            {
              error: "image_too_large",
              message: "Page Builder images must be 10 MB or smaller.",
            },
            413,
          );
        }
      }
      if (folder === PAGE_BUILDER_VIDEO_FOLDER) {
        if (!PAGE_BUILDER_VIDEO_TYPES.has(contentType.toLowerCase())) {
          return c.json(
            {
              error: "unsupported_video_type",
              message: "Use an MP4, WebM, or MOV video.",
            },
            415,
          );
        }
        if (!size || size > PAGE_BUILDER_VIDEO_MAX_BYTES) {
          return c.json(
            {
              error: "video_too_large",
              message: "Page Builder cover videos must be 50 MB or smaller.",
            },
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
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: 600 },
      );
      return c.json({ url, key }, 200);
    },
  );

  app.get("/admin/beats", requireAdmin, async (c) => {
    const all = await db.select().from(beats).orderBy(desc(beats.createdAt));
    const withUrls = await Promise.all(
      all.map(async (b) => {
        const metadata = normalizeBeatMetadata({
          ...b,
          fileUrls: parseStoredFileUrls(b.fileUrls),
        });
        const fileUrls = JSON.stringify(metadata.fileUrls);
        const needsRepair =
          b.title !== metadata.title ||
          b.bpm !== metadata.bpm ||
          b.musicalKey !== metadata.musicalKey ||
          b.genre !== metadata.genre ||
          b.mood !== metadata.mood ||
          b.tags !== metadata.tags ||
          b.artworkUrl !== metadata.artworkUrl ||
          b.audioUrl !== metadata.audioUrl ||
          b.fileUrls !== fileUrls ||
          b.priceFrom !== metadata.priceFrom;
        if (needsRepair) {
          await db
            .update(beats)
            .set({ ...metadata, fileUrls })
            .where(eq(beats.id, b.id));
        }
        return {
          ...b,
          ...metadata,
          fileUrls,
          // Keep raw storage keys in edit fields; signed URLs are display-only.
          artworkSignedUrl: await signIfKey(metadata.artworkUrl),
          audioSignedUrl: await signIfKey(metadata.audioUrl),
        };
      }),
    );
    return c.json({ beats: withUrls }, 200);
  });

  app.get("/admin/beats/:id", requireAdmin, async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "invalid_beat_id" }, 400);
    const rows = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    const b = rows[0];
    const metadata = normalizeBeatMetadata({
      ...b,
      fileUrls: parseStoredFileUrls(b.fileUrls),
    });
    const fileUrls = JSON.stringify(metadata.fileUrls);
    const needsRepair =
      b.title !== metadata.title ||
      b.bpm !== metadata.bpm ||
      b.musicalKey !== metadata.musicalKey ||
      b.genre !== metadata.genre ||
      b.mood !== metadata.mood ||
      b.tags !== metadata.tags ||
      b.artworkUrl !== metadata.artworkUrl ||
      b.audioUrl !== metadata.audioUrl ||
      b.fileUrls !== fileUrls ||
      b.priceFrom !== metadata.priceFrom;
    if (needsRepair)
      await db
        .update(beats)
        .set({ ...metadata, fileUrls })
        .where(eq(beats.id, id));
    return c.json(
      {
        beat: {
          ...b,
          ...metadata,
          fileUrls,
          artworkSignedUrl: await signIfKey(metadata.artworkUrl),
          audioSignedUrl: await signIfKey(metadata.audioUrl),
        },
      },
      200,
    );
  });

  app.post(
    "/admin/beats",
    requireAdmin,
    zValidator("json", beatInputSchema),
    async (c) => {
      const input = c.req.valid("json");
      const metadata = normalizeBeatMetadata(input);
      if (!metadata.title)
        return c.json(
          { error: "title_required", message: "Give the beat a title." },
          400,
        );
      const id = rid("beat");
      const slug = makeSlug(metadata.title, id);
      await db.insert(beats).values({
        id,
        ...metadata,
        fileUrls: JSON.stringify(metadata.fileUrls),
        slug,
        soldExclusive: input.soldExclusive ?? false,
        featured: input.featured ?? false,
        published: input.published ?? true,
      });
      return c.json({ id, slug }, 200);
    },
  );

  app.put(
    "/admin/beats/:id",
    requireAdmin,
    zValidator("json", beatUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      if (!id) return c.json({ error: "invalid_beat_id" }, 400);
      const rows = await db
        .select()
        .from(beats)
        .where(eq(beats.id, id))
        .limit(1);
      if (rows.length === 0) return c.json({ error: "Not found" }, 404);
      const input = c.req.valid("json");
      const patch: Record<string, unknown> = {};
      const metadata = normalizeBeatMetadata(input);
      if (input.title !== undefined) {
        if (!metadata.title)
          return c.json(
            { error: "title_required", message: "Give the beat a title." },
            400,
          );
        patch.title = metadata.title;
      }
      if (input.bpm !== undefined) patch.bpm = metadata.bpm;
      if (input.musicalKey !== undefined)
        patch.musicalKey = metadata.musicalKey;
      if (input.genre !== undefined) patch.genre = metadata.genre;
      if (input.mood !== undefined) patch.mood = metadata.mood;
      if (input.tags !== undefined) patch.tags = metadata.tags;
      if (input.artworkUrl !== undefined)
        patch.artworkUrl = metadata.artworkUrl;
      if (input.audioUrl !== undefined) patch.audioUrl = metadata.audioUrl;
      if (input.fileUrls !== undefined)
        patch.fileUrls = JSON.stringify(metadata.fileUrls);
      if (input.priceFrom !== undefined) patch.priceFrom = metadata.priceFrom;
      if (input.soldExclusive !== undefined)
        patch.soldExclusive = input.soldExclusive;
      if (input.featured !== undefined) patch.featured = input.featured;
      if (input.published !== undefined) patch.published = input.published;
      await db.update(beats).set(patch).where(eq(beats.id, id));
      return c.json({ ok: true }, 200);
    },
  );

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
    const all = await db
      .select()
      .from(subscribers)
      .orderBy(desc(subscribers.createdAt));
    return c.json({ subscribers: all }, 200);
  });

  app.get("/admin/media-health", requireAdmin, async (c) => {
    const site = await loadSettings();
    const references: Omit<MediaHealthEntry, "status" | "detail">[] = [];
    addMediaReference(
      references,
      "brand-square",
      "Global brand",
      "image",
      site.brand.squareLogoUrl,
    );
    addMediaReference(
      references,
      "brand-full",
      "Global brand",
      "image",
      site.brand.fullLogoUrl,
    );
    addMediaReference(
      references,
      "brand-favicon",
      "Global brand",
      "image",
      site.brand.faviconUrl,
    );
    for (const page of site.pages) {
      const prefix = `page:${page.id}`;
      addMediaReference(
        references,
        `${prefix}:background`,
        `${page.title} background`,
        "image",
        page.layout?.backgroundImage,
      );
      addMediaReference(
        references,
        `${prefix}:header-logo`,
        `${page.title} header logo`,
        "image",
        page.layout?.headerLogoUrl,
      );
      addMediaReference(
        references,
        `${prefix}:footer-logo`,
        `${page.title} footer logo`,
        "image",
        page.layout?.footerLogoUrl,
      );
      addMediaReference(
        references,
        `${prefix}:og-image`,
        `${page.title} OpenGraph image`,
        "image",
        page.seo?.ogImageUrl,
      );
      for (const section of page.sections) {
        const sectionPrefix = `${prefix}:section:${section.id}`;
        addMediaReference(
          references,
          `${sectionPrefix}:image`,
          `${page.title} / ${section.title || section.type}`,
          "image",
          section.imageUrl,
        );
        addMediaReference(
          references,
          `${sectionPrefix}:video`,
          `${page.title} / ${section.title || section.type}`,
          "video",
          section.videoUrl,
        );
        addMediaReference(
          references,
          `${sectionPrefix}:cover-image`,
          `${page.title} / ${section.title || section.type}`,
          "image",
          section.coverImageUrl,
        );
        addMediaReference(
          references,
          `${sectionPrefix}:cover-video`,
          `${page.title} / ${section.title || section.type}`,
          "video",
          section.coverVideoUrl,
        );
        addMediaReference(
          references,
          `${sectionPrefix}:logo`,
          `${page.title} / ${section.title || section.type}`,
          "image",
          section.sectionLogoUrl,
        );
        for (const item of section.items || []) {
          addMediaReference(
            references,
            `${sectionPrefix}:item:${item.id}`,
            `${page.title} / ${item.title}`,
            "image",
            item.imageUrl,
          );
        }
      }
    }
    const beatRows = await db
      .select({
        id: beats.id,
        title: beats.title,
        artworkUrl: beats.artworkUrl,
        audioUrl: beats.audioUrl,
        fileUrls: beats.fileUrls,
      })
      .from(beats);
    for (const beat of beatRows) {
      addMediaReference(
        references,
        `beat:${beat.id}:artwork`,
        `Beat: ${beat.title}`,
        "image",
        beat.artworkUrl,
      );
      addMediaReference(
        references,
        `beat:${beat.id}:audio`,
        `Beat: ${beat.title}`,
        "audio",
        beat.audioUrl,
      );
      try {
        const files = JSON.parse(beat.fileUrls || "{}") as Record<
          string,
          unknown
        >;
        for (const [name, value] of Object.entries(files))
          addMediaReference(
            references,
            `beat:${beat.id}:file:${name}`,
            `Beat: ${beat.title} / ${name}`,
            "file",
            value,
          );
      } catch {
        if (beat.fileUrls)
          addMediaReference(
            references,
            `beat:${beat.id}:files`,
            `Beat: ${beat.title} / files`,
            "file",
            beat.fileUrls,
          );
      }
    }
    const items = await Promise.all(references.map(probeMediaReference));
    const summary = items.reduce<Record<MediaHealthStatus, number>>(
      (counts, item) => {
        counts[item.status] += 1;
        return counts;
      },
      {
        healthy: 0,
        missing: 0,
        broken: 0,
        external: 0,
        public: 0,
        unavailable: 0,
      },
    );
    return c.json({ checkedAt: new Date().toISOString(), summary, items }, 200);
  });

  app.get("/admin/settings", requireAdmin, async (c) => {
    const s = await loadSettings();
    const preview = await publicSettings(s);
    return c.json({ settings: s, preview }, 200);
  });

  app.put(
    "/admin/settings",
    requireAdmin,
    zValidator("json", settingsSchema),
    async (c) => {
      const input = c.req.valid("json");
      const current = await loadSettings();
      const merged = mergeSettings({
        theme: { ...current.theme, ...input.theme },
        fontId: input.fontId ?? current.fontId,
        brand: { ...current.brand, ...input.brand },
        header: { ...current.header, ...input.header },
        footer: { ...current.footer, ...input.footer },
        newsletterPopup: {
          ...current.newsletterPopup,
          ...input.newsletterPopup,
        },
        announcementBanner: input.announcementBanner
          ? {
              ...current.announcementBanner,
              ...input.announcementBanner,
              pageIds:
                input.announcementBanner.pageIds ??
                current.announcementBanner.pageIds,
            }
          : current.announcementBanner,
        socials: input.socials ?? current.socials,
        pages: input.pages ?? current.pages,
        deletedPageIds: input.deletedPageIds ?? current.deletedPageIds,
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
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1);
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
    },
  );

  app.post("/admin/settings/reset", requireAdmin, async (c) => {
    const merged = mergeSettings(null);
    const json = JSON.stringify(merged);
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .limit(1);
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
