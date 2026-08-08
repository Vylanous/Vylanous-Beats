/**
 * Site-wide re-skin settings: color palette, font pairing, brand assets.
 * Single source of truth shared by the admin customization panel and the
 * public site's runtime theme provider.
 */

export interface ThemeColors {
  primary: string; // brand accent (buttons, links, price highlights)
  primaryBright: string; // glow / hover / highlight
  primaryDeep: string; // deep gradient shade
  background: string; // page background
  surface: string; // cards / elevated panels
  surfaceHover: string; // hover surfaces / borders
  text: string; // near-white body/heading text
  muted: string; // secondary/muted text
}

export interface FontPair {
  id: string;
  label: string;
  display: string; // headline font-family
  sub: string; // eyebrow/subheader font-family
  body: string; // body font-family
  googleFontsUrl: string;
}

export interface BrandAssets {
  squareLogoUrl: string; // nav mark / small square logo
  fullLogoUrl: string; // wide wordmark logo (footer, hero)
  faviconUrl: string;
}

export interface SiteSettings {
  theme: ThemeColors;
  fontId: string;
  brand: BrandAssets;
}

export const DEFAULT_THEME: ThemeColors = {
  primary: "#7c2fcb",
  primaryBright: "#a24df5",
  primaryDeep: "#4a1480",
  background: "#0a0a0c",
  surface: "#131318",
  surfaceHover: "#1b1b22",
  text: "#edeef2",
  muted: "#7a7c88",
};

export const DEFAULT_BRAND: BrandAssets = {
  squareLogoUrl: "/brand/Favicon_sharp.png",
  fullLogoUrl: "/brand/Logo_full_transparent.png",
  faviconUrl: "/brand/Favicon_sharp.png",
};

export const FONT_PAIRS: FontPair[] = [
  {
    id: "graffiti-chrome",
    label: "Graffiti Chrome (default)",
    display: "Anton, sans-serif",
    sub: "'League Gothic', sans-serif",
    body: "'Barlow Semi Condensed', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Anton&family=League+Gothic&family=Barlow+Semi+Condensed:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
  },
  {
    id: "trap-bold",
    label: "Trap Bold",
    display: "'Archivo Black', sans-serif",
    sub: "'Oswald', sans-serif",
    body: "'Barlow', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Oswald:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap",
  },
  {
    id: "underground-mono",
    label: "Underground Mono",
    display: "'Bebas Neue', sans-serif",
    sub: "'Rajdhani', sans-serif",
    body: "'Rajdhani', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap",
  },
  {
    id: "studio-editorial",
    label: "Studio Editorial",
    display: "'Big Shoulders Display', sans-serif",
    sub: "'Big Shoulders Text', sans-serif",
    body: "'Work Sans', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Big+Shoulders+Text:wght@500;600&family=Work+Sans:wght@300;400;500;600&display=swap",
  },
  {
    id: "street-luxury",
    label: "Street Luxury",
    display: "Anton, sans-serif",
    sub: "'Bebas Neue', sans-serif",
    body: "'Jost', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Jost:wght@300;400;500;600&display=swap",
  },
  {
    id: "hardcore-industrial",
    label: "Hardcore Industrial",
    display: "'Teko', sans-serif",
    sub: "Teko, sans-serif",
    body: "'Barlow Condensed', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Barlow+Condensed:wght@400;500;600&display=swap",
  },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  theme: DEFAULT_THEME,
  fontId: "graffiti-chrome",
  brand: DEFAULT_BRAND,
};

export function getFontPair(id: string | undefined): FontPair {
  return FONT_PAIRS.find((f) => f.id === id) || FONT_PAIRS[0];
}

/** Merge partial/stored settings over defaults so missing keys never break the UI. */
export function mergeSettings(stored: Partial<SiteSettings> | null | undefined): SiteSettings {
  return {
    theme: stored?.theme ? { ...DEFAULT_THEME, ...stored.theme } : { ...DEFAULT_THEME },
    fontId: stored?.fontId || DEFAULT_SETTINGS.fontId,
    brand: stored?.brand ? { ...DEFAULT_BRAND, ...stored.brand } : { ...DEFAULT_BRAND },
  };
}
