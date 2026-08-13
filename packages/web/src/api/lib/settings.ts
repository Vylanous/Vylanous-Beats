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
  if (settingsCache && Date.now() - settingsCache.at < SETTINGS_TTL_MS) return settingsCache.value;
  let value: SiteSettings;
  try {
    const rows = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).limit(1);
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
  if (
    !value ||
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  )
    return value;
  return signIfKey(value);
}

export async function publicSettings(s: SiteSettings) {
  return {
    ...s,
    brand: {
      squareLogoUrl: await signBrandUrl(s.brand.squareLogoUrl),
      fullLogoUrl: await signBrandUrl(s.brand.fullLogoUrl),
      faviconUrl: await signBrandUrl(s.brand.faviconUrl),
    },
  };
}
