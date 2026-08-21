import { eq } from "drizzle-orm";
import { db } from "../database";
import { settings } from "../database/schema";
import { mergeSettings, type SiteSettings } from "../../shared/site-settings";
import { signIfKey } from "./url-sign";

export const SETTINGS_ID = "site";
const SETTINGS_TTL_MS = 30_000;
let settingsCache: { value: SiteSettings; at: number } | null = null;
export function invalidateSettingsCache(): void {
  settingsCache = null;
}

export async function loadSettings(): Promise<SiteSettings> {
  if (settingsCache && Date.now() - settingsCache.at < SETTINGS_TTL_MS)
    return settingsCache.value;
  let value: SiteSettings;
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .limit(1);
    if (rows.length === 0) value = mergeSettings(null);
    else {
      try {
        value = mergeSettings(JSON.parse(rows[0].json || "{}"));
      } catch {
        value = mergeSettings(null);
      }
    }
  } catch (e) {
    console.error("[db] loadSettings failed (table may be missing)", e);
    value = mergeSettings(null);
  }
  settingsCache = { value, at: Date.now() };
  return value;
}

export async function signBrandUrl(value: string): Promise<string> {
  // signIfKey handles raw keys, public paths, external URLs, and previously
  // persisted signed storage URLs. This keeps Builder Studio media durable even
  // when an older admin session saved a presigned URL instead of its object key.
  return signIfKey(value || "");
}

export async function publicSettings(s: SiteSettings) {
  const { builder: _privateBuilder, ...publicSite } = s;
  void _privateBuilder;
  return {
    ...publicSite,
    brand: {
      squareLogoUrl: await signBrandUrl(s.brand.squareLogoUrl),
      fullLogoUrl: await signBrandUrl(s.brand.fullLogoUrl),
      faviconUrl: await signBrandUrl(s.brand.faviconUrl),
    },
    pages: await Promise.all(
      s.pages.map(async (page) => ({
        ...page,
        layout: page.layout
          ? {
              ...page.layout,
              backgroundImage: await signBrandUrl(
                page.layout.backgroundImage || "",
              ),
              headerLogoUrl: await signBrandUrl(
                page.layout.headerLogoUrl || "",
              ),
              footerLogoUrl: await signBrandUrl(
                page.layout.footerLogoUrl || "",
              ),
            }
          : page.layout,
        seo: page.seo
          ? {
              ...page.seo,
              ogImageUrl: await signBrandUrl(page.seo.ogImageUrl || ""),
            }
          : page.seo,
        sections: await Promise.all(
          page.sections.map(async (section) => ({
            ...section,
            imageUrl: await signBrandUrl(section.imageUrl || ""),
            sectionLogoUrl: await signBrandUrl(section.sectionLogoUrl || ""),
            coverImageUrl: await signBrandUrl(section.coverImageUrl || ""),
            coverVideoUrl: await signBrandUrl(section.coverVideoUrl || ""),
            items: section.items
              ? await Promise.all(
                  section.items.map(async (item) => ({
                    ...item,
                    imageUrl: await signBrandUrl(item.imageUrl || ""),
                  })),
                )
              : section.items,
          })),
        ),
      })),
    ),
  };
}
