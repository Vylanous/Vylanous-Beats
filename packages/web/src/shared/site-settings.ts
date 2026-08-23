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

export const BUILDER_FONT_OPTIONS = [
  {
    id: "anton",
    label: "Anton",
    family: "Anton, sans-serif",
    googleFamily: "Anton",
  },
  {
    id: "archivo-black",
    label: "Archivo Black",
    family: "'Archivo Black', sans-serif",
    googleFamily: "Archivo Black",
  },
  {
    id: "barlow",
    label: "Barlow",
    family: "Barlow, sans-serif",
    googleFamily: "Barlow",
  },
  {
    id: "barlow-condensed",
    label: "Barlow Condensed",
    family: "'Barlow Condensed', sans-serif",
    googleFamily: "Barlow Condensed",
  },
  {
    id: "bebas-neue",
    label: "Bebas Neue",
    family: "'Bebas Neue', sans-serif",
    googleFamily: "Bebas Neue",
  },
  {
    id: "big-shoulders",
    label: "Big Shoulders Display",
    family: "'Big Shoulders Display', sans-serif",
    googleFamily: "Big Shoulders Display",
  },
  {
    id: "black-ops-one",
    label: "Black Ops One",
    family: "'Black Ops One', sans-serif",
    googleFamily: "Black Ops One",
  },
  {
    id: "bodoni-moda",
    label: "Bodoni Moda",
    family: "'Bodoni Moda', serif",
    googleFamily: "Bodoni Moda",
  },
  {
    id: "cormorant-garamond",
    label: "Cormorant Garamond",
    family: "'Cormorant Garamond', serif",
    googleFamily: "Cormorant Garamond",
  },
  {
    id: "dela-gothic-one",
    label: "Dela Gothic One",
    family: "'Dela Gothic One', sans-serif",
    googleFamily: "Dela Gothic One",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    family: "'DM Sans', sans-serif",
    googleFamily: "DM Sans",
  },
  {
    id: "dm-serif-display",
    label: "DM Serif Display",
    family: "'DM Serif Display', serif",
    googleFamily: "DM Serif Display",
  },
  {
    id: "dosis",
    label: "Dosis",
    family: "Dosis, sans-serif",
    googleFamily: "Dosis",
  },
  {
    id: "exo-2",
    label: "Exo 2",
    family: "'Exo 2', sans-serif",
    googleFamily: "Exo 2",
  },
  {
    id: "fjalla-one",
    label: "Fjalla One",
    family: "'Fjalla One', sans-serif",
    googleFamily: "Fjalla One",
  },
  {
    id: "futura",
    label: "Futura",
    family: "Futura, 'Trebuchet MS', sans-serif",
  },
  {
    id: "ibm-plex-mono",
    label: "IBM Plex Mono",
    family: "'IBM Plex Mono', monospace",
    googleFamily: "IBM Plex Mono",
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    family: "'IBM Plex Sans', sans-serif",
    googleFamily: "IBM Plex Sans",
  },
  {
    id: "inter",
    label: "Inter",
    family: "Inter, sans-serif",
    googleFamily: "Inter",
  },
  {
    id: "jost",
    label: "Jost",
    family: "Jost, sans-serif",
    googleFamily: "Jost",
  },
  {
    id: "josefin-sans",
    label: "Josefin Sans",
    family: "'Josefin Sans', sans-serif",
    googleFamily: "Josefin Sans",
  },
  {
    id: "karla",
    label: "Karla",
    family: "Karla, sans-serif",
    googleFamily: "Karla",
  },
  {
    id: "league-gothic",
    label: "League Gothic",
    family: "'League Gothic', sans-serif",
    googleFamily: "League Gothic",
  },
  {
    id: "libre-baskerville",
    label: "Libre Baskerville",
    family: "'Libre Baskerville', serif",
    googleFamily: "Libre Baskerville",
  },
  {
    id: "manrope",
    label: "Manrope",
    family: "Manrope, sans-serif",
    googleFamily: "Manrope",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    family: "Montserrat, sans-serif",
    googleFamily: "Montserrat",
  },
  {
    id: "noto-sans",
    label: "Noto Sans",
    family: "'Noto Sans', sans-serif",
    googleFamily: "Noto Sans",
  },
  {
    id: "nunito-sans",
    label: "Nunito Sans",
    family: "'Nunito Sans', sans-serif",
    googleFamily: "Nunito Sans",
  },
  {
    id: "oswald",
    label: "Oswald",
    family: "Oswald, sans-serif",
    googleFamily: "Oswald",
  },
  {
    id: "outfit",
    label: "Outfit",
    family: "Outfit, sans-serif",
    googleFamily: "Outfit",
  },
  {
    id: "playfair-display",
    label: "Playfair Display",
    family: "'Playfair Display', serif",
    googleFamily: "Playfair Display",
  },
  {
    id: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    family: "'Plus Jakarta Sans', sans-serif",
    googleFamily: "Plus Jakarta Sans",
  },
  {
    id: "poppins",
    label: "Poppins",
    family: "Poppins, sans-serif",
    googleFamily: "Poppins",
  },
  {
    id: "press-start-2p",
    label: "Press Start 2P",
    family: "'Press Start 2P', monospace",
    googleFamily: "Press Start 2P",
  },
  {
    id: "rajdhani",
    label: "Rajdhani",
    family: "Rajdhani, sans-serif",
    googleFamily: "Rajdhani",
  },
  {
    id: "raleway",
    label: "Raleway",
    family: "Raleway, sans-serif",
    googleFamily: "Raleway",
  },
  {
    id: "roboto-condensed",
    label: "Roboto Condensed",
    family: "'Roboto Condensed', sans-serif",
    googleFamily: "Roboto Condensed",
  },
  {
    id: "roboto-slab",
    label: "Roboto Slab",
    family: "'Roboto Slab', serif",
    googleFamily: "Roboto Slab",
  },
  {
    id: "rubik",
    label: "Rubik",
    family: "Rubik, sans-serif",
    googleFamily: "Rubik",
  },
  {
    id: "russo-one",
    label: "Russo One",
    family: "'Russo One', sans-serif",
    googleFamily: "Russo One",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: "'Space Grotesk', sans-serif",
    googleFamily: "Space Grotesk",
  },
  {
    id: "space-mono",
    label: "Space Mono",
    family: "'Space Mono', monospace",
    googleFamily: "Space Mono",
  },
  {
    id: "spline-sans",
    label: "Spline Sans",
    family: "'Spline Sans', sans-serif",
    googleFamily: "Spline Sans",
  },
  {
    id: "syne",
    label: "Syne",
    family: "Syne, sans-serif",
    googleFamily: "Syne",
  },
  {
    id: "teko",
    label: "Teko",
    family: "Teko, sans-serif",
    googleFamily: "Teko",
  },
  {
    id: "times-new-roman",
    label: "Times New Roman",
    family: "'Times New Roman', Times, serif",
  },
  {
    id: "titillium-web",
    label: "Titillium Web",
    family: "'Titillium Web', sans-serif",
    googleFamily: "Titillium Web",
  },
  {
    id: "urbanist",
    label: "Urbanist",
    family: "Urbanist, sans-serif",
    googleFamily: "Urbanist",
  },
  {
    id: "work-sans",
    label: "Work Sans",
    family: "'Work Sans', sans-serif",
    googleFamily: "Work Sans",
  },
  {
    id: "arial-narrow",
    label: "Arial Narrow",
    family: "'Arial Narrow', Arial, sans-serif",
  },
] as const;

export type BuilderFontId = (typeof BUILDER_FONT_OPTIONS)[number]["id"];
export const BUILDER_FONT_IDS = BUILDER_FONT_OPTIONS.map((font) => font.id) as [
  BuilderFontId,
  ...BuilderFontId[],
];

const LEGACY_SECTION_FONT_MAP: Record<string, BuilderFontId> = {
  brand: "anton",
  anton: "anton",
  league: "league-gothic",
  barlow: "barlow-condensed",
  editorial: "playfair-display",
  mono: "space-mono",
  condensed: "arial-narrow",
};

export function normalizeBuilderFont(value: unknown): BuilderFontId {
  const candidate = typeof value === "string" ? value : "";
  if ((BUILDER_FONT_IDS as readonly string[]).includes(candidate))
    return candidate as BuilderFontId;
  return LEGACY_SECTION_FONT_MAP[candidate] || "anton";
}

export function getBuilderFont(value: unknown) {
  const id = normalizeBuilderFont(value);
  return BUILDER_FONT_OPTIONS.find((font) => font.id === id) || BUILDER_FONT_OPTIONS[0];
}

export type BuilderEyebrowSize = "12px" | "14px" | "16px" | "18px" | "20px";
export type BuilderHeadingSize =
  | "32px"
  | "40px"
  | "48px"
  | "56px"
  | "64px"
  | "72px"
  | "88px"
  | "104px";
export type BuilderBodySize = "14px" | "16px" | "18px" | "20px" | "22px" | "24px";

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
  palette?: "brand" | "mono" | "electric" | "sunset" | "forest";
  headingScale?: "compact" | "standard" | "display" | "hero";
  paddingX?: "none" | "tight" | "normal" | "wide";
  shadow?: "none" | "soft" | "glow" | "dramatic";
  borderStyle?:
    | "none"
    | "subtle"
    | "accent"
    | "chrome"
    | "thin"
    | "double"
    | "dashed"
    | "gradient"
    | "neon";
  /** Optional color used by section glow shadows and animated border treatments. */
  glowColor?: string;
  /** Decorative motion is disabled for visitors who prefer reduced motion. */
  glowAnimation?: "none" | "move" | "pulse" | "slowFlash";
  customColor?: string;
  /** Heading and card-title font; preserves the existing section font selector. */
  fontFamily?: BuilderFontId;
  /** Optional body-copy font that can differ from the heading font. */
  bodyFontFamily?: BuilderFontId;
  /** Direct text sizes applied responsively by the public renderer. */
  eyebrowSize?: BuilderEyebrowSize;
  headingSize?: BuilderHeadingSize;
  bodySize?: BuilderBodySize;
}

export type PressKitPlatform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "spotify"
  | "soundcloud"
  | "x"
  | "website"
  | "other";

export interface PressKitMetric {
  id: string;
  /** References a global Site Builder social link when this metric is profile-linked. */
  socialId?: string;
  platform: PressKitPlatform;
  label?: string;
  handle?: string;
  followers?: number;
  subscribers?: number;
  videos?: number;
  posts?: number;
  views?: number;
  likes?: number;
  engagementRate?: number;
  url?: string;
}

export interface PressKitBreakdown {
  label: string;
  value: number;
}

export interface PressKitAudience {
  gender?: PressKitBreakdown[];
  age?: PressKitBreakdown[];
  locations?: PressKitBreakdown[];
  note?: string;
}

export interface PressKitData {
  updatedAt?: string;
  sourceNote?: string;
  metrics: PressKitMetric[];
  audience: PressKitAudience;
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
  /** Enables the Builder's restricted bold, italic, and underline inline formatting syntax. */
  bodyFormat?: "plain" | "inline";
  imageUrl?: string;
  videoUrl?: string;
  /** Dedicated 16:9 cover displayed above any section content. */
  coverImageUrl?: string;
  /** Optional muted, looping 16:9 cover video displayed in place of a cover image. */
  coverVideoUrl?: string;
  coverOverlay?: "none" | "soft" | "strong";
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  collection?: string;
  /** Optional in-page anchor used by navigation links and deep links. */
  anchorId?: string;
  /** Optional admin-only CSS hook for advanced layouts. */
  customClass?: string;
  /** Optional accessible label for the rendered section landmark. */
  ariaLabel?: string;
  /** Optional uploaded logo displayed at the top of this section. */
  sectionLogoUrl?: string;
  /** Accessible label for the section logo image. */
  sectionLogoAlt?: string;
  items?: SectionItem[];
  pressKit?: PressKitData;
  layout?: SectionLayout;
}

export interface PageSeo {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
}

export interface PageChromeLinkage {
  header?: boolean;
  navigation?: boolean;
  footer?: boolean;
}

export interface PageHeaderActions {
  /** Optional visibility override for the authenticated Beats Vault action. */
  showVault?: boolean;
  vaultLabel?: string;
  vaultHref?: string;
  /** Optional visibility override for the unauthenticated Sign In action. */
  showSignIn?: boolean;
  signInLabel?: string;
  signInHref?: string;
  /** Optional visibility override for the shopping cart action. */
  showCart?: boolean;
  /** Optional visibility override for the responsive menu action. */
  showMenu?: boolean;
}

export const PAGE_TREATMENT_OPTIONS = [
  "none",
  "grain",
  "grid",
  "spotlight",
  "halftone",
  "lines",
  "topography",
  "aurora",
] as const;
export type PageTreatment = (typeof PAGE_TREATMENT_OPTIONS)[number];

export interface PageLayout {
  showHeader?: boolean;
  showFooter?: boolean;
  background?: "default" | "mesh" | "ink";
  /** When false, this page opts out of the shared storefront color aesthetic. */
  inheritTheme?: boolean;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  surfaceColor?: string;
  borderColor?: string;
  /** Stored Builder image key or approved external URL used behind the whole page. */
  backgroundImage?: string;
  backgroundImageFit?: "cover" | "contain" | "tile";
  backgroundImagePosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundOverlay?: "none" | "soft" | "medium" | "strong";
  /** Decorative treatment layered above the page background and below content. */
  pageTreatment?: PageTreatment;
  /** Defaults inherited by untouched sections to make a page visually distinct. */
  pageFont?: BuilderFontId;
  contentWidth?: "narrow" | "standard" | "wide" | "full";
  sectionSpacing?: "tight" | "normal" | "relaxed" | "cinematic";
  eyebrowColor?: string;
  linkColor?: string;
  /** Optional text wordmark shown in this page’s shared header. */
  wordmark?: string;
  /** Optional uploaded logo shown in this page’s shared header. */
  headerLogoUrl?: string;
  /** Optional label shown beside the page-specific header logo. */
  headerLabel?: string;
  /** Optional destination used when the shared header logo or wordmark is clicked. */
  headerLogoHref?: string;
  /** Optional uploaded logo shown in this page’s shared footer. */
  footerLogoUrl?: string;
  /** Optional label shown beside the page-specific footer logo. */
  footerLabel?: string;
  /** Optional second word in the wordmark with its own accent color. */
  wordmarkAccent?: string;
  /** Optional wordmark accent color, independent from page links. */
  wordmarkAccentColor?: string;
  chrome?: PageChromeLinkage;
  /** Optional page-only header action overrides; omitted values inherit universal header settings. */
  headerActions?: PageHeaderActions;
  /** Global social-link IDs selected for this page header; omitted means inherit. */
  headerSocialIds?: string[];
  /** Global social-link IDs selected for this page footer; omitted means inherit. */
  footerSocialIds?: string[];
  /** Social links created only for this page; never added to Universal Settings. */
  pageSocialLinks?: SocialLink[];
}

export interface BuilderPage {
  id: string;
  slug: string;
  path?: string;
  /** Optional parent Builder page; enables nested paths and local sub-navigation. */
  parentPageId?: string;
  title: string;
  navLabel: string;
  published: boolean;
  showInNav: boolean;
  showInFooter?: boolean;
  /** Controls whether this page presents links to its published child pages. */
  showChildNavigation?: boolean;
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
  | "threads"
  | "linkedin"
  | "twitch"
  | "discord"
  | "telegram"
  | "bandcamp"
  | "appleMusic"
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
  showMenu: boolean;
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

export interface AnnouncementBannerSettings {
  enabled: boolean;
  message: string;
  ctaLabel: string;
  ctaHref: string;
  tone: "accent" | "sale" | "notice";
  target: "all" | "selected";
  pageIds: string[];
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
  announcementBanner: AnnouncementBannerSettings;
  socials: SocialLink[];
  pages: BuilderPage[];
  /** IDs of removable seeded pages intentionally deleted by the owner. */
  deletedPageIds: string[];
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
  showMenu: true,
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

export const DEFAULT_ANNOUNCEMENT_BANNER: AnnouncementBannerSettings = {
  enabled: false,
  message: "",
  ctaLabel: "",
  ctaHref: "",
  tone: "accent",
  target: "all",
  pageIds: [],
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
  palette: "brand",
  headingScale: "standard",
  paddingX: "normal",
  shadow: "none",
  borderStyle: "none",
  glowColor: "",
  glowAnimation: "none",
  customColor: "",
  fontFamily: "anton",
  bodyFontFamily: "barlow",
  eyebrowSize: "16px",
  headingSize: "64px",
  bodySize: "18px",
};

function makeSection(
  id: string,
  type: PageSectionType,
  values: Omit<PageSection, "id" | "type">,
): PageSection {
  return {
    id,
    type,
    ...values,
    layout: { ...DEFAULT_SECTION_LAYOUT, ...values.layout },
  };
}

function makePage(
  values: Omit<BuilderPage, "path" | "layout"> & {
    path: string;
    layout?: PageLayout;
  },
): BuilderPage {
  return {
    ...values,
    layout: {
      showHeader: true,
      showFooter: true,
      background: "default",
      inheritTheme: true,
      primaryColor: "",
      backgroundColor: "",
      textColor: "",
      mutedColor: "",
      surfaceColor: "",
      borderColor: "",
      wordmark: "",
      headerLogoUrl: "",
      headerLabel: "",
      footerLogoUrl: "",
      footerLabel: "",
      wordmarkAccent: "",
      wordmarkAccentColor: "",
      backgroundImage: "",
      backgroundImageFit: "cover",
      backgroundImagePosition: "center",
      backgroundOverlay: "medium",
      pageTreatment: "none",
      eyebrowColor: "",
      linkColor: "",
      chrome: { header: false, navigation: false, footer: false },
      ...values.layout,
    },
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
        layout: {
          surface: "mesh",
          spacing: "cinematic",
          mediaPosition: "right",
        },
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
      makeSection("beats_catalog", "beatCatalog", {
        title: "Browse the catalog",
      }),
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
      makeSection("licensing_tiers", "licenseTiers", {
        title: "Choose your license",
      }),
      makeSection("licensing_marquee", "marquee", { title: "LEASE OR OWN" }),
      makeSection("licensing_compare", "licenseComparison", {
        title: "Compare Licenses",
      }),
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
      makeSection("about_marquee", "marquee", {
        title: "PROD. VYLANOUS BEATS",
      }),
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
    layout: {
      inheritTheme: false,
      background: "ink",
      primaryColor: "#D2B48C",
      backgroundColor: "#0C0C0D",
      textColor: "#F4F0E8",
      mutedColor: "#B5AEA3",
      surfaceColor: "#171717",
      borderColor: "#4A453E",
      eyebrowColor: "#E7E0D5",
      linkColor: "#D2B48C",
      wordmark: "VYLANOUS ARTIST",
      wordmarkAccent: "ARTIST",
      wordmarkAccentColor: "#D94A4A",
      pageTreatment: "none",
    },
    sections: [
      makeSection("artist_hero", "hero", {
        eyebrow: "The Artist",
        title: "Vylanous",
        body: "A hip-hop artist and producer building a sound that lands hard and stays melodic.",
        ctaLabel: "Listen to beats",
        ctaHref: "/beats",
        layout: { surface: "ink", spacing: "cinematic" },
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
        title: "Press Kit",
        body: "Audience snapshots and platform reach for booking, press, and collaboration inquiries.",
        pressKit: { metrics: [], audience: {} },
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
  makePage({
    id: "page_login",
    slug: "login",
    path: "/login",
    title: "Sign In",
    navLabel: "Sign In",
    published: true,
    showInNav: false,
    showInFooter: false,
    navOrder: 70,
    isSystem: true,
    seo: {
      title: "Sign In | Vylanous Beats",
      description: "Sign in or create a Vylanous Beats customer account.",
      canonicalPath: "/login",
    },
    sections: [
      makeSection("login_hero", "hero", {
        eyebrow: "Customer portal",
        title: "Keep every license in your vault.",
        body: "Sign in to unlock the full beat catalog, purchase licenses, access secure downloads, and keep your order history across the website and mobile app.",
        layout: { surface: "mesh", spacing: "cinematic" },
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
  announcementBanner: DEFAULT_ANNOUNCEMENT_BANNER,
  socials: DEFAULT_SOCIALS,
  pages: DEFAULT_PAGES,
  deletedPageIds: [],
  fourthwall: DEFAULT_FOURTHWALL,
  builder: DEFAULT_BUILDER_META,
};

export function getFontPair(id: string | undefined): FontPair {
  return FONT_PAIRS.find((font) => font.id === id) || FONT_PAIRS[0]!;
}

function pagePath(page: Pick<BuilderPage, "path" | "slug">): string {
  return page.path || (page.slug === "home" ? "/" : `/${page.slug}`);
}

function mergeSectionItems(
  templateItems: SectionItem[] | undefined,
  storedItems: SectionItem[] | undefined,
): SectionItem[] | undefined {
  if (!Array.isArray(storedItems)) return templateItems;
  const templates = new Map((templateItems || []).map((item) => [item.id, item]));
  return storedItems.map((storedItem, index) => ({
    ...templates.get(storedItem.id),
    ...storedItem,
    id: storedItem.id || `item_${index}`,
  }));
}

function mergePage(
  defaultPage: BuilderPage,
  storedPage: Partial<BuilderPage> | undefined,
): BuilderPage {
  const sections = Array.isArray(storedPage?.sections) ? storedPage.sections : defaultPage.sections;
  return {
    ...defaultPage,
    ...storedPage,
    path: pagePath({
      path: storedPage?.path,
      slug: storedPage?.slug || defaultPage.slug,
    }),
    seo: { ...defaultPage.seo, ...storedPage?.seo },
    layout: {
      ...defaultPage.layout,
      ...storedPage?.layout,
      chrome: { ...defaultPage.layout?.chrome, ...storedPage?.layout?.chrome },
    },
    sections: sections.map((storedSection, index) => {
      const template = defaultPage.sections.find((candidate) => candidate.id === storedSection.id);
      return {
        ...template,
        ...storedSection,
        id: storedSection.id || `section_${index}`,
        items: mergeSectionItems(template?.items, storedSection.items),
        layout: {
          ...DEFAULT_SECTION_LAYOUT,
          ...template?.layout,
          ...storedSection.layout,
          fontFamily: normalizeBuilderFont(storedSection.layout?.fontFamily),
        },
      } as PageSection;
    }),
  };
}

function mergePages(storedPages: unknown, deletedPageIds: string[] = []): BuilderPage[] {
  const saved = Array.isArray(storedPages) ? (storedPages as Partial<BuilderPage>[]) : [];
  const deleted = new Set(deletedPageIds);
  const matched = new Set<number>();
  const core = DEFAULT_PAGES.filter((defaultPage) => !deleted.has(defaultPage.id)).map(
    (defaultPage) => {
      const index = saved.findIndex(
        (candidate) =>
          candidate.id === defaultPage.id ||
          candidate.slug === defaultPage.slug ||
          candidate.path === defaultPage.path,
      );
      if (index >= 0) matched.add(index);
      return mergePage(defaultPage, index >= 0 ? saved[index] : undefined);
    },
  );
  const custom = saved
    .filter((_, index) => !matched.has(index))
    .map((page, index) =>
      mergePage(
        {
          id: page.id || `page_custom_${index}`,
          slug: page.slug || `page-${index + 1}`,
          path: pagePath({
            path: page.path,
            slug: page.slug || `page-${index + 1}`,
          }),
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
type StoredSiteSettings = Omit<Partial<SiteSettings>, "newsletterPopup" | "announcementBanner"> & {
  newsletterPopup?: Partial<NewsletterPopupSettings>;
  announcementBanner?: Partial<AnnouncementBannerSettings>;
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
    announcementBanner: stored?.announcementBanner
      ? {
          ...DEFAULT_ANNOUNCEMENT_BANNER,
          ...stored.announcementBanner,
          pageIds: Array.isArray(stored.announcementBanner.pageIds)
            ? stored.announcementBanner.pageIds
            : [],
        }
      : { ...DEFAULT_ANNOUNCEMENT_BANNER },
    socials: Array.isArray(stored?.socials) ? stored.socials : DEFAULT_SOCIALS,
    deletedPageIds: Array.isArray(stored?.deletedPageIds) ? stored.deletedPageIds : [],
    pages: mergePages(
      stored?.pages,
      Array.isArray(stored?.deletedPageIds) ? stored.deletedPageIds : [],
    ),
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
