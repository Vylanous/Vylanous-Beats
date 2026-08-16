/**
 * Vylanous Site Builder configuration: a versioned source of truth for global
 * chrome, navigation, reusable sections, visual treatments, and public SEO.
 */

export interface ThemeColors {
  primary: string;
  primaryBright: string;
  primaryDeep: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  muted: string;
}

export interface FontPair {
  id: string;
  label: string;
  display: string;
  sub: string;
  body: string;
  googleFontsUrl: string;
}

export interface BrandAssets {
  squareLogoUrl: string;
  fullLogoUrl: string;
  faviconUrl: string;
}

export type PageSectionType =
  | "hero"
  | "text"
  | "image"
  | "video"
  | "gallery"
  | "featureCards"
  | "callout"
  | "marquee"
  | "divider"
  | "spacer"
  | "pressKit"
  | "merch"
  | "featuredBeats"
  | "beatCatalog"
  | "licenseTiers"
  | "licenseComparison";

export interface SectionLayout {
  width?: "narrow" | "standard" | "wide" | "full";
  spacing?: "tight" | "normal" | "relaxed" | "cinematic";
  alignment?: "left" | "center" | "right";
  surface?: "transparent" | "ink" | "mesh" | "accent" | "bordered";
  columns?: 1 | 2 | 3 | 4;
  mediaPosition?: "none" | "left" | "right" | "background" | "top";
  mediaFit?: "cover" | "contain";
  mediaAspect?: "auto" | "square" | "wide" | "portrait" | "cinema";
  imageOverlay?: "none" | "soft" | "strong";
  borderRadius?: "none" | "soft" | "rounded";
  emphasis?: "standard" | "accent" | "muted";
}

export interface SectionItem {
  id: string;
  title: string;
  body?: string;
  imageUrl?: string;
  href?: string;
  label?: string;
}

export interface PageSection {
  id: string;
  type: PageSectionType;
  eyebrow?: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  videoUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  collection?: string;
  items?: SectionItem[];
  layout?: SectionLayout;
}

export interface PageSeo {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
}

export interface PageLayout {
  showHeader?: boolean;
  showFooter?: boolean;
  background?: "default" | "mesh" | "ink";
}

export interface BuilderPage {
  id: string;
  slug: string;
  path?: string;
  title: string;
  navLabel: string;
  published: boolean;
  showInNav: boolean;
  showInFooter?: boolean;
  navOrder?: number;
  isSystem?: boolean;
  sections: PageSection[];
  seo?: PageSeo;
  layout?: PageLayout;
}

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "spotify"
  | "soundcloud"
  | "facebook"
  | "x"
  | "custom";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  showInHeader?: boolean;
  showInFooter?: boolean;
}

export interface HeaderSettings {
  showWordmark: boolean;
  sticky: boolean;
  transparentAtTop: boolean;
  showCart: boolean;
  showSocialLinks: boolean;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface FooterSettings {
  description: string;
  contactEmail: string;
  showNavigation: boolean;
  showNewsletter: boolean;
  newsletterHeading: string;
  newsletterButton: string;
  legalLine: string;
}

export interface NewsletterPopupSettings {
  enabled: boolean;
  delayMs: number;
  showOnce: boolean;
  homeOnly: boolean;
  title: string;
  body: string;
  placeholder: string;
  buttonLabel: string;
  dismissLabel: string;
  successMessage: string;
  consentText: string;
}

export interface FourthwallSettings {
  shopDomain: string;
  defaultCollection: string;
  currency: string;
}

export interface BuilderDraft {
  id: string;
  pageId: string;
  updatedAt: string;
  snapshot: BuilderPage;
}

export interface BuilderTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  sections: PageSection[];
}

export interface BuilderVersion {
  id: string;
  pageId: string;
  label: string;
  createdAt: string;
  snapshot: BuilderPage;
}

export interface BuilderMeta {
  drafts: BuilderDraft[];
  templates: BuilderTemplate[];
  versions: BuilderVersion[];
}

export interface SiteSettings {
  theme: ThemeColors;
  fontId: string;
  brand: BrandAssets;
  header: HeaderSettings;
  footer: FooterSettings;
  newsletterPopup: NewsletterPopupSettings;
  socials: SocialLink[];
  pages: BuilderPage[];
  fourthwall: FourthwallSettings;
  builder: BuilderMeta;
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

export const DEFAULT_HEADER: HeaderSettings = {
  showWordmark: true,
  sticky: true,
  transparentAtTop: true,
  showCart: true,
  showSocialLinks: false,
  ctaLabel: "",
  ctaHref: "",
};

export const DEFAULT_FOOTER: FooterSettings = {
  description:
    "Premium hip-hop beats. Rhythmic expression, melodious compositions, affordable licensing for independent artists.",
  contactEmail: "support@vylanous.com",
  showNavigation: true,
  showNewsletter: true,
  newsletterHeading: "Get New Drops",
  newsletterButton: "Subscribe",
  legalLine: "Prod. Vylanous Beats",
};

export const DEFAULT_SOCIALS: SocialLink[] = [];

export const DEFAULT_NEWSLETTER_POPUP: NewsletterPopupSettings = {
  enabled: true,
  delayMs: 4500,
  showOnce: true,
  homeOnly: false,
  title: "Get the next drop first.",
  body: "New beats, studio notes, and private releases — straight to your inbox.",
  placeholder: "your@email.com",
  buttonLabel: "Join the list",
  dismissLabel: "Not now",
  successMessage: "You're on the list. Watch your inbox for the next drop.",
  consentText: "I agree to receive new drops and updates by email.",
};

export const DEFAULT_FOURTHWALL: FourthwallSettings = {
  shopDomain: "vylanous-shop.fourthwall.com",
  defaultCollection: "all",
  currency: "USD",
};

const DEFAULT_SECTION_LAYOUT: Required<SectionLayout> = {
  width: "wide",
  spacing: "normal",
  alignment: "left",
  surface: "transparent",
  columns: 3,
  mediaPosition: "none",
  mediaFit: "cover",
  mediaAspect: "auto",
  imageOverlay: "none",
  borderRadius: "rounded",
  emphasis: "standard",
};

function makeSection(
  id: string,
  type: PageSectionType,
  values: Omit<PageSection, "id" | "type">,
): PageSection {
  return { id, type, ...values, layout: { ...DEFAULT_SECTION_LAYOUT, ...values.layout } };
}

function makePage(
  values: Omit<BuilderPage, "path" | "layout"> & { path: string; layout?: PageLayout },
): BuilderPage {
  return {
    ...values,
    layout: { showHeader: true, showFooter: true, background: "default", ...values.layout },
  };
}

export const DEFAULT_PAGES: BuilderPage[] = [
  makePage({
    id: "page_home",
    slug: "home",
    path: "/",
    title: "Home",
    navLabel: "Home",
    published: true,
    showInNav: false,
    showInFooter: false,
    navOrder: 0,
    isSystem: true,
    seo: {
      title: "Vylanous Beats | Premium Hip-Hop Beats",
      description:
        "Premium hip-hop beats, flexible licensing, and instant delivery for independent artists.",
      canonicalPath: "/",
    },
    sections: [
      makeSection("home_hero", "hero", {
        eyebrow: "Premium Hip-Hop Beats",
        title: "Beats That\nHit Different.",
        body: "Rhythmic expression, melodious compositions, and street-ready energy. Lease or own — affordable licensing for independent artists who want to stand out.",
        ctaLabel: "Browse Beats",
        ctaHref: "/beats",
        secondaryCtaLabel: "View Licensing",
        secondaryCtaHref: "/licensing",
        layout: { surface: "mesh", spacing: "cinematic", mediaPosition: "right" },
      }),
      makeSection("home_drops", "marquee", { title: "NEW DROPS" }),
      makeSection("home_featured", "featuredBeats", {
        eyebrow: "Hand-picked",
        title: "Featured Beats",
        ctaLabel: "All beats",
        ctaHref: "/beats",
      }),
      makeSection("home_values", "featureCards", {
        items: [
          {
            id: "delivery",
            title: "Instant Delivery",
            body: "Pay and download immediately. Files hit your inbox too.",
          },
          {
            id: "licensing",
            title: "Clear Licensing",
            body: "Five tiers from free to full exclusive ownership. No fine-print games.",
          },
          {
            id: "quality",
            title: "Studio Quality",
            body: "WAV, MP3, and trackout stems mixed for radio and streaming.",
          },
        ],
      }),
      makeSection("home_licenses", "licenseTiers", {
        eyebrow: "Pick Your Rights",
        title: "Licensing",
        ctaLabel: "Compare All Licenses",
        ctaHref: "/licensing",
      }),
      makeSection("home_brand", "marquee", { title: "VYLANOUS BEATS" }),
    ],
  }),
  makePage({
    id: "page_beats",
    slug: "beats",
    path: "/beats",
    title: "Beat Catalog",
    navLabel: "Beats",
    published: true,
    showInNav: true,
    showInFooter: true,
    navOrder: 10,
    isSystem: true,
    seo: {
      title: "Hip-Hop Beats for Sale | Vylanous Beats",
      description:
        "Browse premium hip-hop instrumentals with clear license options and instant delivery.",
      canonicalPath: "/beats",
    },
    sections: [
      makeSection("beats_hero", "hero", {
        eyebrow: "The Vault",
        title: "Beat Catalog",
        body: "Find the sound for your next release. Preview every beat, compare licenses, and move when the record feels right.",
        layout: { surface: "mesh", spacing: "relaxed" },
      }),
      makeSection("beats_catalog", "beatCatalog", { title: "Browse the catalog" }),
    ],
  }),
  makePage({
    id: "page_licensing",
    slug: "licensing",
    path: "/licensing",
    title: "Licensing",
    navLabel: "Licensing",
    published: true,
    showInNav: true,
    showInFooter: true,
    navOrder: 20,
    isSystem: true,
    seo: {
      title: "Beat Licensing | Vylanous Beats",
      description: "Compare simple beat licensing tiers from a free demo to exclusive ownership.",
      canonicalPath: "/licensing",
    },
    sections: [
      makeSection("licensing_hero", "hero", {
        eyebrow: "Pick Your Rights",
        title: "Licensing",
        body: "From a free demo license to full exclusive ownership. Transparent terms, no hidden fees. All non-exclusive licenses require crediting Prod. Vylanous Beats.",
        layout: { surface: "mesh", spacing: "relaxed", alignment: "center" },
      }),
      makeSection("licensing_tiers", "licenseTiers", { title: "Choose your license" }),
      makeSection("licensing_marquee", "marquee", { title: "LEASE OR OWN" }),
      makeSection("licensing_compare", "licenseComparison", { title: "Compare Licenses" }),
      makeSection("licensing_notes", "featureCards", {
        layout: { columns: 2 },
        items: [
          {
            id: "non-exclusive",
            title: "Non-Exclusive vs Exclusive",
            body: "Lease licenses are non-exclusive. An Exclusive License transfers full ownership and removes the beat from the store.",
          },
          {
            id: "custom-deal",
            title: "Need a custom deal?",
            body: "Bulk licensing, custom beats, or split agreements — reach out and we will sort it.",
            label: "Get in touch",
            href: "/about",
          },
        ],
      }),
    ],
  }),
  makePage({
    id: "page_about",
    slug: "about",
    path: "/about",
    title: "About",
    navLabel: "About",
    published: true,
    showInNav: true,
    showInFooter: true,
    navOrder: 30,
    isSystem: true,
    seo: {
      title: "About Vylanous Beats",
      description:
        "Learn about the sound, values, and artist-first philosophy behind Vylanous Beats.",
      canonicalPath: "/about",
    },
    sections: [
      makeSection("about_hero", "hero", {
        eyebrow: "The Story",
        title: "Vylanous Beats",
        body: "Hip-hop production built on rhythmic expression and melodious composition. Vylanous Beats crafts beats for independent artists who refuse to sound like everyone else — premium quality, street energy, and pricing that does not gatekeep talent.",
        imageUrl: "/brand/Favicon_sharp.png",
        layout: {
          surface: "mesh",
          spacing: "relaxed",
          mediaPosition: "left",
          mediaFit: "contain",
          mediaAspect: "square",
        },
      }),
      makeSection("about_marquee", "marquee", { title: "PROD. VYLANOUS BEATS" }),
      makeSection("about_values", "featureCards", {
        items: [
          {
            id: "sound",
            title: "Sound First",
            body: "Every beat is mixed for the speakers it will actually play on — phones, cars, clubs, and streaming platforms.",
          },
          {
            id: "fair",
            title: "Fair Licensing",
            body: "Five clear tiers from free demos to full exclusive ownership.",
          },
          {
            id: "artists",
            title: "Built For Artists",
            body: "Affordable high-volume licensing so independent artists can release more, faster, without going broke.",
          },
        ],
      }),
      makeSection("about_contact", "callout", {
        title: "Let's Work",
        body: "Custom beats, bulk deals, or just want to connect? Reach out — every serious inquiry gets a reply.",
        ctaLabel: "support@vylanous.com",
        ctaHref: "mailto:support@vylanous.com",
        secondaryCtaLabel: "Browse the catalog",
        secondaryCtaHref: "/beats",
        layout: { surface: "accent", alignment: "center", width: "standard" },
      }),
    ],
  }),
  makePage({
    id: "page_artist",
    slug: "artist",
    path: "/artist",
    title: "Artist Profile",
    navLabel: "Artist",
    published: true,
    showInNav: true,
    showInFooter: true,
    navOrder: 40,
    seo: {
      title: "Vylanous | Artist & Producer",
      description: "Discover Vylanous: artist, producer, and the sound behind Vylanous Beats.",
      canonicalPath: "/artist",
    },
    sections: [
      makeSection("artist_hero", "hero", {
        eyebrow: "The Artist",
        title: "Vylanous",
        body: "A hip-hop artist and producer building a sound that lands hard and stays melodic.",
        ctaLabel: "Listen to beats",
        ctaHref: "/beats",
        layout: { surface: "mesh", spacing: "cinematic" },
      }),
      makeSection("artist_story", "text", {
        title: "Built for the loudest rooms",
        body: "Use this section to tell your story, introduce your sound, and point listeners toward your latest release.",
      }),
    ],
  }),
  makePage({
    id: "page_epk",
    slug: "epk",
    path: "/epk",
    title: "Electronic Press Kit",
    navLabel: "EPK",
    published: true,
    showInNav: true,
    showInFooter: true,
    navOrder: 50,
    seo: {
      title: "Vylanous EPK | Press & Booking",
      description:
        "Official electronic press kit for Vylanous, including artist bio, press materials, and booking details.",
      canonicalPath: "/epk",
    },
    sections: [
      makeSection("epk_hero", "hero", {
        eyebrow: "Press & Booking",
        title: "Electronic Press Kit",
        body: "A concise home for your bio, performance highlights, contact details, and downloadable press materials.",
        layout: { surface: "mesh", spacing: "cinematic" },
      }),
      makeSection("epk_press", "pressKit", {
        title: "Press Materials",
        body: "Add your official bio, key links, performance history, and a downloadable one-sheet here.",
      }),
    ],
  }),
  makePage({
    id: "page_merch",
    slug: "merch",
    path: "/merch",
    title: "Merch",
    navLabel: "Merch",
    published: true,
    showInNav: true,
    showInFooter: true,
    navOrder: 60,
    seo: {
      title: "Vylanous Merch | Official Store",
      description: "Shop official Vylanous merchandise and limited drops.",
      canonicalPath: "/merch",
    },
    sections: [
      makeSection("merch_hero", "hero", {
        eyebrow: "Official Goods",
        title: "Wear the sound",
        body: "Limited drops, everyday staples, and pieces made for the people who move with the music.",
        layout: { surface: "mesh", spacing: "cinematic" },
      }),
      makeSection("merch_collection", "merch", {
        title: "Latest Drop",
        body: "Products ship and checkout securely through Fourthwall.",
        collection: "all",
      }),
    ],
  }),
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
      "https://fonts.googleapis.com/css2?family=Teko:wght@500&family=Barlow+Condensed:wght@400;500;600&display=swap",
  },
];

export const DEFAULT_BUILDER_META: BuilderMeta = {
  drafts: [],
  templates: [],
  versions: [],
};

export const DEFAULT_SETTINGS: SiteSettings = {
  theme: DEFAULT_THEME,
  fontId: "graffiti-chrome",
  brand: DEFAULT_BRAND,
  header: DEFAULT_HEADER,
  footer: DEFAULT_FOOTER,
  newsletterPopup: DEFAULT_NEWSLETTER_POPUP,
  socials: DEFAULT_SOCIALS,
  pages: DEFAULT_PAGES,
  fourthwall: DEFAULT_FOURTHWALL,
  builder: DEFAULT_BUILDER_META,
};

export function getFontPair(id: string | undefined): FontPair {
  return FONT_PAIRS.find((font) => font.id === id) || FONT_PAIRS[0];
}

function pagePath(page: Pick<BuilderPage, "path" | "slug">): string {
  return page.path || (page.slug === "home" ? "/" : `/${page.slug}`);
}

function mergePage(
  defaultPage: BuilderPage,
  storedPage: Partial<BuilderPage> | undefined,
): BuilderPage {
  const sections = Array.isArray(storedPage?.sections) ? storedPage.sections : defaultPage.sections;
  return {
    ...defaultPage,
    ...storedPage,
    path: pagePath({ path: storedPage?.path, slug: storedPage?.slug || defaultPage.slug }),
    seo: { ...defaultPage.seo, ...storedPage?.seo },
    layout: { ...defaultPage.layout, ...storedPage?.layout },
    sections: sections.map((storedSection, index) => {
      const template = defaultPage.sections.find((candidate) => candidate.id === storedSection.id);
      return {
        ...template,
        ...storedSection,
        id: storedSection.id || `section_${index}`,
        layout: { ...DEFAULT_SECTION_LAYOUT, ...template?.layout, ...storedSection.layout },
      } as PageSection;
    }),
  };
}

function mergePages(storedPages: unknown): BuilderPage[] {
  const saved = Array.isArray(storedPages) ? (storedPages as Partial<BuilderPage>[]) : [];
  const matched = new Set<number>();
  const core = DEFAULT_PAGES.map((defaultPage) => {
    const index = saved.findIndex(
      (candidate) =>
        candidate.id === defaultPage.id ||
        candidate.slug === defaultPage.slug ||
        candidate.path === defaultPage.path,
    );
    if (index >= 0) matched.add(index);
    return mergePage(defaultPage, index >= 0 ? saved[index] : undefined);
  });
  const custom = saved
    .filter((_, index) => !matched.has(index))
    .map((page, index) =>
      mergePage(
        {
          id: page.id || `page_custom_${index}`,
          slug: page.slug || `page-${index + 1}`,
          path: pagePath({ path: page.path, slug: page.slug || `page-${index + 1}` }),
          title: page.title || "Untitled page",
          navLabel: page.navLabel || page.title || "Untitled",
          published: page.published ?? false,
          showInNav: page.showInNav ?? false,
          showInFooter: page.showInFooter ?? false,
          navOrder: page.navOrder ?? 100 + index,
          sections: [],
        },
        page,
      ),
    );
  return [...core, ...custom];
}

/** Merge stored settings over defaults so production data gains new builder controls safely. */
type StoredSiteSettings = Omit<Partial<SiteSettings>, "newsletterPopup"> & {
  newsletterPopup?: Partial<NewsletterPopupSettings>;
};

export function mergeSettings(stored: StoredSiteSettings | null | undefined): SiteSettings {
  return {
    theme: stored?.theme ? { ...DEFAULT_THEME, ...stored.theme } : { ...DEFAULT_THEME },
    fontId: stored?.fontId || DEFAULT_SETTINGS.fontId,
    brand: stored?.brand ? { ...DEFAULT_BRAND, ...stored.brand } : { ...DEFAULT_BRAND },
    header: stored?.header ? { ...DEFAULT_HEADER, ...stored.header } : { ...DEFAULT_HEADER },
    footer: stored?.footer ? { ...DEFAULT_FOOTER, ...stored.footer } : { ...DEFAULT_FOOTER },
    newsletterPopup: stored?.newsletterPopup
      ? { ...DEFAULT_NEWSLETTER_POPUP, ...stored.newsletterPopup }
      : { ...DEFAULT_NEWSLETTER_POPUP },
    socials: Array.isArray(stored?.socials) ? stored.socials : DEFAULT_SOCIALS,
    pages: mergePages(stored?.pages),
    fourthwall: stored?.fourthwall
      ? { ...DEFAULT_FOURTHWALL, ...stored.fourthwall }
      : { ...DEFAULT_FOURTHWALL },
    builder: {
      drafts: Array.isArray(stored?.builder?.drafts) ? stored.builder.drafts : [],
      templates: Array.isArray(stored?.builder?.templates) ? stored.builder.templates : [],
      versions: Array.isArray(stored?.builder?.versions) ? stored.builder.versions : [],
    },
  };
}
