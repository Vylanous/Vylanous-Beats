import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, getFontPair, type SiteSettings } from "../../shared/site-settings";

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

/** Maps our named theme keys to the CSS custom properties every Tailwind
 * utility across the site already reads from (see styles.css @theme block). */
function applyTheme(theme: SiteSettings["theme"]) {
  const root = document.documentElement;
  root.style.setProperty("--color-vb-black", theme.background);
  root.style.setProperty("--color-vb-ink", theme.surface);
  root.style.setProperty("--color-vb-ink-2", theme.surfaceHover);
  root.style.setProperty("--color-vb-purple", theme.primary);
  root.style.setProperty("--color-vb-purple-bright", theme.primaryBright);
  root.style.setProperty("--color-vb-purple-deep", theme.primaryDeep);
  root.style.setProperty("--color-vb-silver-bright", theme.text);
  root.style.setProperty("--color-vb-muted", theme.muted);
  // shadcn-style tokens some components fall back to
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--foreground", theme.text);
  root.style.setProperty("--card", theme.surface);
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--accent", theme.primary);
  root.style.setProperty("--ring", theme.primary);
  root.style.setProperty("theme-color", theme.background);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.background);
}

function applyFont(fontId: string) {
  const pair = getFontPair(fontId);
  const root = document.documentElement;
  root.style.setProperty("--font-display", pair.display);
  root.style.setProperty("--font-sub", pair.sub);
  root.style.setProperty("--font-body", pair.body);

  const linkId = "vb-dynamic-font";
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== pair.googleFontsUrl) link.href = pair.googleFontsUrl;
}

function applyFavicon(faviconUrl: string) {
  if (!faviconUrl) return;
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.settings) return;
        setSettings(data.settings);
        applyTheme(data.settings.theme);
        applyFont(data.settings.fontId);
        applyFavicon(data.settings.brand?.faviconUrl);
      })
      .catch(() => {
        /* keep defaults on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

/** Read the live re-skin settings (theme colors, font, brand assets) anywhere in the app. */
export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
