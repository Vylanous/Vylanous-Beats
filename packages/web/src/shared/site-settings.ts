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

export type PageSectionType = "hero" | "text" | "image" | "pressKit" | "merch";

export interface PageSection {
  id: string;
  type: PageSectionType;
  eyebrow?: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  collection?: string;
}

export interface PageSeo {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
}

export interface BuilderPage {
  id: string;
  slug: string;
  title: string;
  navLabel: string;
  published: boolean;
  showInNav: boolean;
  sections: PageSection[];
  seo?: PageSeo;
}

export interface FourthwallSettings {
  shopDomain: string;
  defaultCollection: string;
  currency: string;
}

export interface SiteSettings {
  theme: ThemeColors;
  fontId: string;
  brand: BrandAssets;
  pages: BuilderPage[];
  fourthwall: FourthwallSettings;
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

export const DEFAULT_FOURTHWALL: FourthwallSettings = {
  shopDomain: "vylanous-shop.fourthwall.com",
  defaultCollection: "all",
  currency: "USD",
};

export const DEFAULT_PAGES: BuilderPage[] = [
  {
    id: "page_artist",
    slug: "artist",
    title: "Artist Profile",
    navLabel: "Artist",
    published: true,
    showInNav: true,
    seo: {
      title: "Vylanous | Artist & Producer",
      description: "Discover Vylanous: artist, producer, and the sound behind Vylanous Beats.",
      canonicalPath: "/artist",
    },
    sections: [
      {
        id: "artist_hero",
        type: "hero",
        eyebrow: "The Artist",
        title: "Vylanous",
        body: "A hip-hop artist and producer building a sound that lands hard and stays melodic.",
        ctaLabel: "Listen to beats",
        ctaHref: "/beats",
      },
      {
        id: "artist_story",
        type: "text",
        title: "Built for the loudest rooms",
        body: "Use this section to tell your story, introduce your sound, and point listeners toward your latest release.",
      },
    ],
  },
  {
    id: "page_epk",
    slug: "epk",
    title: "Electronic Press Kit",
    navLabel: "EPK",
    published: true,
    showInNav: true,
    seo: {
      title: "Vylanous EPK | Press & Booking",
      description:
        "Official electronic press kit for Vylanous, including artist bio, press materials, and booking details.",
      canonicalPath: "/epk",
    },
    sections: [
      {
        id: "epk_hero",
        type: "hero",
        eyebrow: "Press & Booking",
        title: "Electronic Press Kit",
        body: "A concise home for your bio, performance highlights, contact details, and downloadable press materials.",
      },
      {
        id: "epk_press",
        type: "pressKit",
        title: "Press Materials",
        body: "Add your official bio, key links, performance history, and a downloadable one-sheet here.",
      },
    ],
  },
  {
    id: "page_merch",
    slug: "merch",
    title: "Merch",
    navLabel: "Merch",
    published: true,
    showInNav: true,
    seo: {
      title: "Vylanous Merch | Official Store",
      description: "Shop official Vylanous merchandise and limited drops.",
      canonicalPath: "/merch",
    },
    sections: [
      {
        id: "merch_hero",
        type: "hero",
        eyebrow: "Official Goods",
        title: "Wear the sound",
        body: "Limited drops, everyday staples, and pieces made for the people who move with the music.",
      },
      {
        id: "merch_collection",
        type: "merch",
        title: "Latest Drop",
        body: "Products ship and checkout securely through Fourthwall.",
        collection: "all",
      },
    ],
  },
];

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
  pages: DEFAULT_PAGES,
  fourthwall: DEFAULT_FOURTHWALL,
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
    pages: Array.isArray(stored?.pages) ? stored.pages : DEFAULT_PAGES,
    fourthwall: stored?.fourthwall
      ? { ...DEFAULT_FOURTHWALL, ...stored.fourthwall }
      : { ...DEFAULT_FOURTHWALL },
  };
}
