/**
 * Vylanous Site Builder renderer: translates saved page blocks and layout
 * decisions into the public music storefront without sacrificing commerce flows.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Check, ExternalLink, Search, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "./layout";
import { BeatCard } from "./beat-card";
import { FourthwallMerch } from "./fourthwall-merch";
import { Marquee } from "./marquee";
import { api } from "../lib/api";
import { builderPagePath, normalizeManagedPath } from "../lib/page-routes";
import { parseInlineText, stripInlineText } from "../lib/inline-text";
import { useSiteSettings } from "../lib/site-settings";
import { customerFetch, useCustomer } from "../lib/customer";
import { LICENSE_TIERS, formatCad } from "../../shared/licenses";
import type { Beat } from "../../api/database/schema";
import { getBuilderFont } from "../../shared/site-settings";
import type {
  BuilderPage,
  PageSection,
  PressKitBreakdown,
  PressKitMetric,
  SectionLayout,
} from "../../shared/site-settings";

const SPACING: Record<NonNullable<SectionLayout["spacing"]>, string> = {
  tight: "py-8 sm:py-10",
  normal: "py-14 sm:py-16",
  relaxed: "py-18 sm:py-24",
  cinematic: "py-24 sm:py-32",
};
const ALIGNMENT: Record<NonNullable<SectionLayout["alignment"]>, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};
const PALETTE: Record<NonNullable<SectionLayout["palette"]>, string> = {
  brand: "builder-palette-brand",
  mono: "builder-palette-mono",
  electric: "builder-palette-electric",
  sunset: "builder-palette-sunset",
  forest: "builder-palette-forest",
};
const HEADING_SCALE: Record<NonNullable<SectionLayout["headingScale"]>, string> = {
  compact: "builder-heading-compact",
  standard: "builder-heading-standard",
  display: "builder-heading-display",
  hero: "builder-heading-hero",
};
const PADDING_X: Record<NonNullable<SectionLayout["paddingX"]>, string> = {
  none: "px-0",
  tight: "px-3 sm:px-5",
  normal: "px-5 sm:px-8",
  wide: "px-8 sm:px-14 lg:px-20",
};
const SHADOW: Record<NonNullable<SectionLayout["shadow"]>, string> = {
  none: "",
  soft: "shadow-[0_18px_55px_rgba(0,0,0,0.18)]",
  glow: "builder-page-shadow-glow",
  dramatic: "shadow-[0_26px_90px_rgba(0,0,0,0.38)]",
};
const BORDER_STYLE: Record<NonNullable<SectionLayout["borderStyle"]>, string> = {
  none: "border-transparent",
  subtle: "builder-border-subtle",
  accent: "builder-border-accent",
  chrome: "builder-border-chrome",
  thin: "builder-border-thin",
  double: "border-2 builder-border-double",
  dashed: "border-dashed builder-border-dashed",
  gradient: "builder-border-gradient",
  neon: "builder-border-neon",
};
const SURFACE: Record<NonNullable<SectionLayout["surface"]>, string> = {
  transparent: "",
  ink: "bg-vb-ink",
  mesh: "bg-mesh grain relative overflow-hidden",
  accent: "bg-vb-purple/[0.06] border-y border-vb-purple/20",
  bordered: "border-y border-white/[0.07]",
};
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};
const ASPECT: Record<NonNullable<SectionLayout["mediaAspect"]>, string> = {
  auto: "aspect-auto",
  square: "aspect-square",
  wide: "aspect-[16/9]",
  portrait: "aspect-[3/4]",
  cinema: "aspect-[21/9]",
};
const RADIUS: Record<NonNullable<SectionLayout["borderRadius"]>, string> = {
  none: "rounded-none",
  soft: "rounded-xl",
  rounded: "rounded-2xl",
};

const DEFAULT_LAYOUT: Required<SectionLayout> = {
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

function usePageMetadata(page: BuilderPage | undefined) {
  useEffect(() => {
    if (!page) return;
    const title = page.seo?.title || `${page.title} | Vylanous Beats`;
    const description =
      page.seo?.description ||
      stripInlineText(page.sections.find((section) => section.body)?.body || "");
    const canonicalPath = page.seo?.canonicalPath || page.path || `/${page.slug}`;
    const canonicalUrl = new URL(canonicalPath, window.location.origin).toString();
    const imageUrl =
      page.seo?.ogImageUrl ||
      new URL("/brand/Logo_full_transparent.png", window.location.origin).toString();
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", imageUrl);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", imageUrl);
    setMeta("name", "robots", page.seo?.noIndex ? "noindex, nofollow" : "index, follow");
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [page]);
}

export function ManagedPage({ path }: { path: string }) {
  const { pages, fourthwall } = useSiteSettings();
  const managedPath = normalizeManagedPath(path);
  const page = pages.find(
    (candidate) => builderPagePath(candidate) === managedPath && candidate.published,
  );
  usePageMetadata(page);
  if (!page) return <UnavailablePage />;
  const parentPage = page.parentPageId
    ? pages.find((candidate) => candidate.id === page.parentPageId && candidate.published)
    : undefined;
  const navigationRoot = parentPage || page;
  const childPages = pages
    .filter((candidate) => candidate.parentPageId === navigationRoot.id && candidate.published)
    .sort((a, b) => (a.navOrder ?? 1000) - (b.navOrder ?? 1000));
  const showLocalNavigation = Boolean(navigationRoot.showChildNavigation && childPages.length);
  return (
    <Layout
      showHeader={page.layout?.showHeader !== false}
      showFooter={page.layout?.showFooter !== false}
      pageBackground={page.layout?.background}
      pageStyle={page.layout}
    >
      {showLocalNavigation && (
        <LocalSubNavigation root={navigationRoot} current={page} childPages={childPages} />
      )}
      {page.sections.map((section) => (
        <BuilderSection
          key={section.id}
          section={section}
          pageId={page.id}
          pageLayout={page.layout}
          currency={fourthwall.currency}
          shopDomain={fourthwall.shopDomain}
        />
      ))}
    </Layout>
  );
}

function LocalSubNavigation({
  root,
  current,
  childPages,
}: {
  root: BuilderPage;
  current: BuilderPage;
  childPages: BuilderPage[];
}) {
  const links = [root, ...childPages];
  return (
    <nav
      aria-label={`${root.navLabel} sub-navigation`}
      className="page-sub-navigation border-b bg-vb-black/70 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8 no-scrollbar">
        {links.map((link) => {
          const href = builderPagePath(link);
          const active = link.id === current.id;
          return (
            <Link
              key={link.id}
              to={href}
              aria-current={active ? "page" : undefined}
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: "instant" as ScrollBehavior,
                })
              }
              className={`page-sub-navigation-button shrink-0 rounded-full border px-4 py-2 font-sub text-xs uppercase tracking-[0.16em] transition ${active ? "is-active" : ""}`}
            >
              {link.navLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function UnavailablePage() {
  return (
    <Layout>
      <div className="grid min-h-[65vh] place-items-center px-5 text-center">
        <div>
          <p className="font-sub uppercase tracking-[0.25em] text-vb-purple-bright">Not found</p>
          <h1 className="mt-3 font-display text-6xl uppercase text-chrome">Page unavailable</h1>
          <Link
            to="/"
            className="mt-6 inline-block font-sub uppercase tracking-wider text-vb-silver-bright hover:text-vb-purple-bright"
          >
            Return home →
          </Link>
        </div>
      </div>
    </Layout>
  );
}

function BuilderSection({
  section,
  pageId,
  pageLayout,
  currency,
  shopDomain,
}: {
  section: PageSection;
  pageId: string;
  pageLayout?: BuilderPage["layout"];
  currency: string;
  shopDomain: string;
}) {
  const layout: Required<SectionLayout> = {
    ...DEFAULT_LAYOUT,
    ...section.layout,
    // Width is intentionally fluid. Legacy saved width/contentWidth values are
    // ignored so the same page fills its available viewport on every device.
    width: "full",
    ...(pageLayout?.sectionSpacing ? { spacing: pageLayout.sectionSpacing } : {}),
  };
  const selectedHeadingFont = getBuilderFont(pageLayout?.pageFont || layout.fontFamily);
  const selectedBodyFont = getBuilderFont(layout.bodyFontFamily);
  const sectionAttributes = {
    id: section.anchorId || undefined,
    "aria-label": section.ariaLabel || undefined,
  };
  const customStyle = {
    "--builder-heading-font-family": selectedHeadingFont.family,
    "--builder-body-font-family": selectedBodyFont.family,
    "--builder-eyebrow-size": layout.eyebrowSize,
    "--builder-heading-size": layout.headingSize,
    "--builder-body-size": layout.bodySize,
    "--builder-glow-color":
      layout.glowColor || layout.customColor || pageLayout?.primaryColor || "#7C2FCB",
    ...(layout.customColor ? { "--builder-custom-color": layout.customColor } : {}),
  } as Record<string, string>;
  const customColorClass = layout.customColor ? "builder-custom-color" : "";
  if (section.type === "marquee")
    return (
      <div
        {...sectionAttributes}
        style={customStyle}
        className={`${section.customClass || ""} ${PALETTE[layout.palette]} builder-font-selected builder-direct-typography ${HEADING_SCALE[layout.headingScale]} ${SHADOW[layout.shadow]} ${customColorClass}`}
      >
        <Marquee text={section.title || "VYLANOUS BEATS"} />
      </div>
    );
  if (section.type === "divider")
    return (
      <div
        {...sectionAttributes}
        style={customStyle}
        className={`${section.customClass || ""} ${PALETTE[layout.palette]} builder-page-divider h-px w-full bg-gradient-to-r from-transparent via-vb-purple/70 to-transparent`}
      />
    );
  if (section.type === "spacer")
    return (
      <div
        {...sectionAttributes}
        aria-hidden="true"
        className={`${section.customClass || ""} ${PALETTE[layout.palette]} ${SPACING[layout.spacing]}`}
      />
    );
  return (
    <section
      {...sectionAttributes}
      style={customStyle}
      className={`${section.customClass || ""} relative isolate border ${SURFACE[layout.surface]} ${PALETTE[layout.palette]} builder-font-selected builder-direct-typography ${HEADING_SCALE[layout.headingScale]} ${SHADOW[layout.shadow]} ${BORDER_STYLE[layout.borderStyle]} builder-border-${layout.borderStyle} builder-glow-${layout.glowAnimation} ${customColorClass}`}
    >
      <div
        className={`relative flex w-full max-w-none min-w-0 ${SPACING[layout.spacing]} flex-col ${PADDING_X[layout.paddingX]} ${ALIGNMENT[layout.alignment]}`}
      >
        <SectionCover section={section} />
        <SectionLogo section={section} />
        {section.type === "hero" && <HeroSection section={section} layout={layout} />}
        {section.type === "text" && <CopySection section={section} layout={layout} />}
        {section.type === "image" && <ImageSection section={section} layout={layout} />}
        {section.type === "video" && <VideoSection section={section} layout={layout} />}
        {section.type === "gallery" && <GallerySection section={section} layout={layout} />}
        {section.type === "featureCards" && <FeatureCards section={section} layout={layout} />}
        {section.type === "callout" && <CalloutSection section={section} layout={layout} />}
        {section.type === "emailCaptureForm" && (
          <EmailCaptureForm section={section} pageId={pageId} layout={layout} />
        )}
        {section.type === "pressKit" && <PressKitSection section={section} layout={layout} />}
        {section.type === "merch" && (
          <MerchSection section={section} currency={currency} shopDomain={shopDomain} />
        )}
        {section.type === "featuredBeats" && <FeaturedBeats section={section} layout={layout} />}
        {section.type === "publishedBeats" && (
          <PublishedBeats section={section} pageId={pageId} layout={layout} />
        )}
        {section.type === "beatCatalog" && <BeatCatalog />}
        {section.type === "licenseTiers" && <LicenseTiers section={section} layout={layout} />}
        {section.type === "licenseComparison" && <LicenseComparison section={section} />}
      </div>
    </section>
  );
}

function SectionLogo({ section }: { section: PageSection }) {
  if (!section.sectionLogoUrl) return null;
  return (
    <div className="mb-6 flex w-full justify-start">
      <img
        src={section.sectionLogoUrl}
        alt={section.sectionLogoAlt || section.title || "Section logo"}
        loading="lazy"
        decoding="async"
        className="max-h-24 max-w-[min(18rem,80vw)] object-contain object-left"
      />
    </div>
  );
}

function SectionCover({ section }: { section: PageSection }) {
  if (!section.coverImageUrl && !section.coverVideoUrl) return null;
  const overlay =
    section.coverOverlay === "strong"
      ? "after:absolute after:inset-0 after:bg-vb-black/70"
      : section.coverOverlay === "soft"
        ? "after:absolute after:inset-0 after:bg-vb-black/35"
        : "";
  return (
    <div
      className={`relative mb-8 w-full overflow-hidden rounded-2xl border border-white/[0.1] aspect-[16/9] ${overlay}`}
    >
      {section.coverVideoUrl ? (
        // oxlint-disable-next-line jsx-a11y/media-has-caption -- decorative muted cover video without spoken content.
        <video
          className="h-full w-full object-cover"
          src={section.coverVideoUrl}
          poster={section.coverImageUrl || undefined}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
      ) : (
        <img
          src={section.coverImageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function CopyBlock({
  section,
  layout,
  heading = "h2",
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
  heading?: "h1" | "h2";
}) {
  const Heading = heading;
  const emphasis =
    layout.emphasis === "accent"
      ? "text-purple-glow"
      : layout.emphasis === "muted"
        ? "text-vb-silver"
        : "text-chrome";
  return (
    <div className={`flex max-w-3xl flex-col ${ALIGNMENT[layout.alignment]}`}>
      {section.eyebrow && (
        <p className="page-eyebrow builder-eyebrow font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg">
          {section.eyebrow}
        </p>
      )}
      <Heading
        className={`builder-section-heading mt-3 whitespace-pre-line font-display uppercase leading-[0.88] ${heading === "h1" ? "text-6xl sm:text-8xl" : "text-5xl sm:text-6xl"} ${emphasis}`}
      >
        {section.title}
      </Heading>
      {section.body && (
        <p className="builder-section-body mt-5 max-w-2xl whitespace-pre-line font-body text-lg leading-relaxed text-vb-silver/70">
          <FormattedBody value={section.body} formatted={section.bodyFormat === "inline"} />
        </p>
      )}
      <Actions section={section} />
    </div>
  );
}

function FormattedBody({ value, formatted }: { value: string; formatted: boolean }) {
  if (!formatted) return value;
  return parseInlineText(value).map((token, index) => {
    if (token.style === "bold") return <strong key={index}>{token.text}</strong>;
    if (token.style === "italic") return <em key={index}>{token.text}</em>;
    if (token.style === "underline") return <u key={index}>{token.text}</u>;
    return <span key={index}>{token.text}</span>;
  });
}

function HeroSection({
  section,
  layout,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
}) {
  const hasMedia = Boolean(section.imageUrl);
  const media = hasMedia && <MediaImage section={section} layout={layout} className="w-full" />;
  if (!hasMedia || layout.mediaPosition === "none")
    return <CopyBlock section={section} layout={layout} heading="h1" />;
  if (layout.mediaPosition === "background")
    return (
      <div
        className={`relative isolate overflow-hidden ${RADIUS[layout.borderRadius]} px-6 py-14 sm:px-10 sm:py-20`}
      >
        <MediaImage
          section={section}
          layout={layout}
          className="absolute inset-0 -z-10 h-full w-full"
        />
        <CopyBlock section={section} layout={{ ...layout, emphasis: "standard" }} heading="h1" />
      </div>
    );
  const reverse = layout.mediaPosition === "left" ? "lg:flex-row-reverse" : "lg:flex-row";
  return (
    <div className={`flex w-full flex-col gap-10 lg:items-center ${reverse}`}>
      <div className="flex-1">
        <CopyBlock section={section} layout={layout} heading="h1" />
      </div>
      <div className="w-full max-w-xl flex-1">{media}</div>
    </div>
  );
}

function CopySection({
  section,
  layout,
  icon,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
  icon?: boolean;
}) {
  return (
    <div className="w-full">
      {icon && (
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-vb-purple/15 font-display text-vb-purple-bright">
          VB
        </div>
      )}
      <CopyBlock section={section} layout={layout} />
    </div>
  );
}
function ImageSection({
  section,
  layout,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
}) {
  return (
    <div className="w-full">
      <MediaImage section={section} layout={layout} className="w-full" />
    </div>
  );
}

function MediaImage({
  section,
  layout,
  className,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
  className: string;
}) {
  if (!section.imageUrl)
    return (
      <div
        className={`${className} ${ASPECT[layout.mediaAspect]} ${RADIUS[layout.borderRadius]} grid place-items-center border border-dashed border-white/15 bg-vb-ink text-sm font-body text-vb-muted`}
      >
        Add an image URL in the Site Builder
      </div>
    );
  const overlay =
    layout.imageOverlay === "strong"
      ? "after:absolute after:inset-0 after:bg-vb-black/70"
      : layout.imageOverlay === "soft"
        ? "after:absolute after:inset-0 after:bg-vb-black/35"
        : "";
  return (
    <div
      className={`relative overflow-hidden border border-white/[0.08] ${ASPECT[layout.mediaAspect]} ${RADIUS[layout.borderRadius]} ${overlay}`}
    >
      <img
        src={section.imageUrl}
        alt={section.title || "Vylanous Beats visual"}
        loading="lazy"
        decoding="async"
        className={`h-full w-full ${layout.mediaFit === "contain" ? "object-contain" : "object-cover"}`}
      />
    </div>
  );
}

function VideoSection({
  section,
  layout,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
}) {
  const source = embedUrl(section.videoUrl || "");
  return (
    <div className="w-full">
      <CopyBlock section={section} layout={layout} />
      {section.videoUrl ? (
        <div
          className={`mt-8 overflow-hidden border border-white/[0.08] ${ASPECT[layout.mediaAspect === "auto" ? "wide" : layout.mediaAspect]} ${RADIUS[layout.borderRadius]}`}
        >
          {source ? (
            <iframe
              className="h-full w-full"
              src={source}
              title={section.title || "Vylanous Beats video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              aria-label={section.title || "Video player"}
              className="h-full w-full object-cover"
              controls
              poster={section.imageUrl}
            >
              <source src={section.videoUrl} />
              <track
                kind="captions"
                label="English captions"
                src="data:text/vtt,WEBVTT"
                srcLang="en"
              />
            </video>
          )}
        </div>
      ) : (
        <MediaImage
          section={section}
          layout={{ ...layout, mediaAspect: "wide" }}
          className="mt-8 w-full"
        />
      )}
    </div>
  );
}

function GallerySection({
  section,
  layout,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
}) {
  return (
    <div className="w-full">
      <CopyBlock section={section} layout={layout} />
      {section.items?.length ? (
        <div className={`mt-8 grid gap-5 ${COLUMNS[layout.columns]}`}>
          {section.items.map((item) => (
            <div key={item.id} className="space-y-3">
              <MediaImage
                section={{
                  ...section,
                  imageUrl: item.imageUrl,
                  title: item.title,
                }}
                layout={layout}
                className="w-full"
              />
              {item.title && (
                <h3 className="font-display text-2xl uppercase text-chrome">{item.title}</h3>
              )}
              {item.body && <p className="font-body text-vb-muted">{item.body}</p>}
              {item.href && <ActionLink href={item.href} label={item.label || "Explore"} />}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 font-body text-vb-muted">Add gallery items in the Site Builder.</p>
      )}
    </div>
  );
}

function FeatureCards({
  section,
  layout,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
}) {
  return (
    <div className="w-full">
      <CopyBlock section={section} layout={layout} />
      {section.items?.length ? (
        <div className={`mt-8 grid gap-5 ${COLUMNS[layout.columns]}`}>
          {section.items.map((item) => (
            <article
              key={item.id}
              className={`${RADIUS[layout.borderRadius]} border border-white/[0.07] bg-vb-ink p-6`}
            >
              <span className="font-display text-4xl text-purple-glow">
                {String(section.items?.indexOf(item) + 1).padStart(2, "0")}
              </span>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  width={1200}
                  height={675}
                  loading="lazy"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="mt-4 aspect-video w-full rounded-lg object-cover"
                />
              )}
              <h3 className="mt-3 font-display text-2xl uppercase text-chrome">{item.title}</h3>
              {item.body && <p className="mt-2 font-body text-vb-muted">{item.body}</p>}
              {item.href && (
                <div className="mt-4">
                  <ActionLink href={item.href} label={item.label || "Explore"} />
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 font-body text-vb-muted">Add cards in the Site Builder.</p>
      )}
    </div>
  );
}
const PRESS_KIT_LABELS: Record<PressKitMetric["platform"], string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  x: "X",
  website: "Website",
  other: "Other",
};

function compactMetric(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function PressKitSection({
  section,
  layout,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
}) {
  const pressKit = section.pressKit || { metrics: [], audience: {} };
  const metrics = pressKit.metrics || [];
  const audienceGroups: {
    key: "gender" | "age" | "locations";
    label: string;
    rows: PressKitBreakdown[];
  }[] = [
    { key: "gender", label: "Gender", rows: pressKit.audience.gender || [] },
    { key: "age", label: "Age groups", rows: pressKit.audience.age || [] },
    {
      key: "locations",
      label: "Top locations",
      rows: pressKit.audience.locations || [],
    },
  ];
  return (
    <div className="w-full">
      <CopyBlock section={section} layout={layout} />
      {metrics.length === 0 && audienceGroups.every((group) => group.rows.length === 0) ? (
        <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-vb-ink/60 p-6 font-body text-sm text-vb-muted">
          Press Kit analytics will appear here once platform and audience data is added in the Site
          Builder.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {metrics.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric) => (
                <article
                  key={metric.id}
                  className={`rounded-xl border border-white/[0.08] bg-vb-ink/80 p-5 ${RADIUS[layout.borderRadius]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-sub text-xs uppercase tracking-[0.18em] text-vb-purple-bright">
                        {PRESS_KIT_LABELS[metric.platform]}
                      </p>
                      <h3 className="mt-2 font-display text-2xl uppercase text-chrome">
                        {metric.label || PRESS_KIT_LABELS[metric.platform]}
                      </h3>
                      {metric.handle && (
                        <p className="mt-1 font-body text-xs text-vb-muted">{metric.handle}</p>
                      )}
                    </div>
                    {metric.url && (
                      <a
                        href={metric.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${metric.label || PRESS_KIT_LABELS[metric.platform]} profile`}
                        className="text-vb-silver/55 hover:text-vb-purple-bright"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {metric.followers !== undefined && (
                      <PressMetric label="Followers" value={compactMetric(metric.followers)} />
                    )}
                    {metric.subscribers !== undefined && (
                      <PressMetric label="Subscribers" value={compactMetric(metric.subscribers)} />
                    )}
                    {metric.videos !== undefined && (
                      <PressMetric label="Videos" value={compactMetric(metric.videos)} />
                    )}
                    {metric.posts !== undefined && (
                      <PressMetric label="Posts" value={compactMetric(metric.posts)} />
                    )}
                    {metric.views !== undefined && (
                      <PressMetric label="Views" value={compactMetric(metric.views)} />
                    )}
                    {metric.likes !== undefined && (
                      <PressMetric label="Likes" value={compactMetric(metric.likes)} />
                    )}
                    {metric.engagementRate !== undefined && (
                      <PressMetric label="Engagement" value={`${metric.engagementRate}%`} />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          {audienceGroups.some((group) => group.rows.length > 0) && (
            <div className="grid gap-5 lg:grid-cols-3">
              {audienceGroups.map(
                (group) =>
                  group.rows.length > 0 && (
                    <div
                      key={group.key}
                      className={`rounded-xl border border-white/[0.08] bg-vb-ink/70 p-5 ${RADIUS[layout.borderRadius]}`}
                    >
                      <h3 className="font-sub text-xs uppercase tracking-[0.18em] text-vb-purple-bright">
                        Audience · {group.label}
                      </h3>
                      <div className="mt-5 space-y-4">
                        {group.rows.map((row) => (
                          <div key={`${group.key}-${row.label}`}>
                            <div className="mb-1 flex items-center justify-between gap-3 font-body text-xs text-vb-silver/70">
                              <span>{row.label}</span>
                              <span>{row.value}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-vb-purple"
                                style={{
                                  width: `${Math.max(0, Math.min(100, row.value))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          )}
          {(pressKit.sourceNote || pressKit.updatedAt || pressKit.audience.note) && (
            <p className="font-body text-xs text-vb-muted">
              {pressKit.sourceNote}
              {pressKit.sourceNote && pressKit.updatedAt ? " · " : ""}
              {pressKit.updatedAt ? `Updated ${pressKit.updatedAt}` : ""}
              {(pressKit.sourceNote || pressKit.updatedAt) && pressKit.audience.note ? " · " : ""}
              {pressKit.audience.note}
            </p>
          )}
        </div>
      )}
      <Actions section={section} />
    </div>
  );
}

function PressMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
      <p className="font-body text-[10px] uppercase tracking-wider text-vb-muted">{label}</p>
      <p className="mt-1 font-display text-xl text-chrome">{value}</p>
    </div>
  );
}

function CalloutSection({
  section,
  layout,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
}) {
  return (
    <div
      className={`w-full border border-vb-purple/30 bg-vb-purple/[0.06] p-8 sm:p-12 ${RADIUS[layout.borderRadius]}`}
    >
      <CopyBlock section={section} layout={layout} />
    </div>
  );
}
function EmailCaptureForm({
  section,
  pageId,
  layout,
}: {
  section: PageSection;
  pageId: string;
  layout: Required<SectionLayout>;
}) {
  const config = {
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    emailLabel: "Email address",
    submitLabel: "Join the list",
    successMessage: "You're on the list. Watch your inbox for the next drop.",
    consentText: "By subscribing, you agree to receive new drops and updates by email.",
    workflowKey: "",
    ...section.emailCapture,
  };
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fieldId = (name: string) => `${section.id}-${name}`;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          sourcePageId: pageId,
          sourceBlockId: section.id,
          ...(config.workflowKey.trim()
            ? { workflowKey: config.workflowKey.trim().toLowerCase() }
            : {}),
        }),
      });
      if (!response.ok) throw new Error("Subscription could not be completed.");
      setStatus("success");
      setFirstName("");
      setLastName("");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMessage("We couldn't save your subscription. Please try again.");
    }
  };

  return (
    <div className={`w-full ${RADIUS[layout.borderRadius]} border border-vb-purple/30 bg-vb-ink/80 p-6 sm:p-8`}>
      <CopyBlock section={section} layout={layout} />
      <form className="mt-7 max-w-3xl" onSubmit={submit} aria-label={section.title || "Email signup"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block font-body text-sm text-vb-silver/80" htmlFor={fieldId("first-name")}>
            {config.firstNameLabel}
            <input
              id={fieldId("first-name")}
              name="firstName"
              aria-label={config.firstNameLabel}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              disabled={status === "submitting" || status === "success"}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black/60 px-4 py-3 font-body text-base text-white outline-none transition placeholder:text-vb-silver/35 focus:border-vb-purple-bright disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          <label className="block font-body text-sm text-vb-silver/80" htmlFor={fieldId("last-name")}>
            {config.lastNameLabel}
            <input
              id={fieldId("last-name")}
              name="lastName"
              aria-label={config.lastNameLabel}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              disabled={status === "submitting" || status === "success"}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black/60 px-4 py-3 font-body text-base text-white outline-none transition placeholder:text-vb-silver/35 focus:border-vb-purple-bright disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1 font-body text-sm text-vb-silver/80" htmlFor={fieldId("email")}>
            {config.emailLabel}
            <input
              id={fieldId("email")}
              name="email"
              aria-label={config.emailLabel}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={status === "submitting" || status === "success"}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black/60 px-4 py-3 font-body text-base text-white outline-none transition placeholder:text-vb-silver/35 focus:border-vb-purple-bright disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          <button
            type="submit"
            disabled={status === "submitting" || status === "success"}
            className="mt-6 shrink-0 rounded-lg bg-vb-purple px-6 py-3 font-sub text-sm uppercase tracking-wide text-white transition hover:bg-vb-purple-bright disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "Joining…" : config.submitLabel}
          </button>
        </div>
        {status === "success" ? (
          <output className="mt-4 block font-body text-sm text-emerald-300" aria-live="polite">
            {config.successMessage}
          </output>
        ) : (
          <>
            <p className="mt-3 font-body text-xs leading-relaxed text-vb-silver/50">{config.consentText}</p>
            {status === "error" && (
              <p className="mt-3 font-body text-sm text-red-300" role="alert">
                {errorMessage}
              </p>
            )}
          </>
        )}
      </form>
    </div>
  );
}

function MerchSection({
  section,
  currency,
  shopDomain,
}: {
  section: PageSection;
  currency: string;
  shopDomain: string;
}) {
  const layout = { ...DEFAULT_LAYOUT, ...section.layout };
  return (
    <div className="w-full">
      <CopyBlock section={section} layout={layout} />
      <div className="mt-9">
        <FourthwallMerch
          collection={section.collection}
          currency={currency}
          shopDomain={shopDomain}
        />
      </div>
    </div>
  );
}

function FeaturedBeats({
  section,
  layout,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["beats", "featured"],
    queryFn: async () => (await api.beats.featured.$get()).json(),
  });
  const beats = (data && "beats" in data ? data.beats : []) as Beat[];
  return (
    <div className="w-full">
      <CopyBlock section={section} layout={layout} />
      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-xl bg-vb-ink" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {beats.slice(0, 6).map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
        </div>
      )}
    </div>
  );
}

function PublishedBeats({
  section,
  pageId,
  layout,
}: {
  section: PageSection;
  pageId: string;
  layout: Required<SectionLayout>;
}) {
  const beatIds = useMemo(
    () => Array.from(new Set(section.beatIds || [])).slice(0, 12),
    [section.beatIds],
  );
  const { data, isLoading, isError } = useQuery({
    queryKey: ["beats", "selected", beatIds],
    enabled: beatIds.length > 0,
    queryFn: async () => {
      const params = new URLSearchParams();
      beatIds.forEach((id) => params.append("id", id));
      const response = await fetch(`/api/beats/selected?${params.toString()}`);
      if (!response.ok) throw new Error("Unable to load selected beats.");
      return response.json() as Promise<{ beats: Beat[] }>;
    },
  });
  const beats = data?.beats || [];
  return (
    <div className="w-full">
      <CopyBlock section={section} layout={layout} />
      {beatIds.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-white/15 bg-vb-ink/60 p-5 font-body text-sm text-vb-muted">
          No published beats have been selected for this section yet.
        </p>
      ) : isLoading ? (
        <div className={`mt-8 grid gap-6 ${COLUMNS[layout.columns]}`}>
          {Array.from({ length: Math.min(beatIds.length, 3) }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-xl bg-vb-ink" />
          ))}
        </div>
      ) : isError || !beats.length ? (
        <p className="mt-8 rounded-xl border border-dashed border-white/15 bg-vb-ink/60 p-5 font-body text-sm text-vb-muted">
          The selected beats are no longer published or available.
        </p>
      ) : (
        <div className={`mt-8 grid gap-6 ${COLUMNS[layout.columns]}`}>
          {beats.map((beat) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              publishedBeatAnalytics={{ pageId, blockId: section.id }}
            />
          ))}
        </div>
      )}
      <Actions section={section} />
    </div>
  );
}

function BeatCatalog() {
  const { ready, customer } = useCustomer();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["beats", customer ? "all" : "featured"],
    enabled: ready,
    queryFn: async () =>
      customer
        ? (await customerFetch("/api/beats")).json()
        : (await api.beats.featured.$get()).json(),
  });
  const beats = useMemo(() => (data && "beats" in data ? data.beats : []) as Beat[], [data]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState("featured");
  const genres = useMemo(
    () => ["All", ...Array.from(new Set(beats.map((beat) => beat.genre)))],
    [beats],
  );
  const filtered = useMemo(() => {
    let list = beats.filter(
      (beat) =>
        (!query ||
          beat.title.toLowerCase().includes(query.toLowerCase()) ||
          beat.tags.toLowerCase().includes(query.toLowerCase()) ||
          beat.mood.toLowerCase().includes(query.toLowerCase())) &&
        (genre === "All" || beat.genre === genre),
    );
    if (sort === "bpm") list = [...list].sort((a, b) => a.bpm - b.bpm);
    if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [beats, genre, query, sort]);
  if (!ready)
    return (
      <div className="py-20 text-center font-sub uppercase tracking-wide text-vb-purple-bright">
        Loading catalog access…
      </div>
    );
  if (!customer)
    return (
      <div>
        <div className="mb-8 rounded-2xl border border-vb-purple/30 bg-vb-ink p-7 sm:p-10">
          <p className="font-sub text-xs uppercase tracking-[.24em] text-vb-purple-bright">
            Featured vault preview
          </p>
          <h2 className="mt-3 font-display text-4xl uppercase text-chrome">
            Hear the latest drops.
          </h2>
          <p className="mt-4 max-w-2xl font-body leading-7 text-vb-silver/65">
            Preview featured beats without an account. Sign in to unlock the complete catalog,
            search every beat, purchase licenses, and keep secure downloads in one shared vault.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-xl bg-vb-purple px-5 py-3 font-sub text-sm uppercase tracking-wide text-white hover:bg-vb-purple-bright"
          >
            Sign in for full access
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-xl bg-vb-ink" />
            ))}
          </div>
        ) : isError || !beats.length ? (
          <p className="py-12 text-center font-body text-vb-muted">
            No featured beats are live yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {beats.slice(0, 6).map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>
        )}
      </div>
    );
  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vb-muted" />
          <input
            aria-label="Search beats, moods, and tags"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search beats, moods, tags…"
            className="w-full rounded-xl border border-white/10 bg-vb-ink py-3 pl-11 pr-4 font-body outline-none focus:border-vb-purple"
          />
        </div>
        <div className="flex gap-3">
          <select
            aria-label="Filter by genre"
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            className="rounded-xl border border-white/10 bg-vb-ink px-4 py-3 font-body text-vb-silver outline-none focus:border-vb-purple"
          >
            {genres.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <div className="relative">
            <SlidersHorizontal
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-vb-muted"
            />
            <select
              aria-label="Sort beats"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-xl border border-white/10 bg-vb-ink py-3 pl-10 pr-4 font-body text-vb-silver outline-none focus:border-vb-purple"
            >
              <option value="featured">Featured</option>
              <option value="bpm">BPM ↑</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-xl bg-vb-ink" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center font-body text-vb-muted">No beats match your search.</p>
      )}
    </div>
  );
}

function LicenseTiers({
  section,
  layout,
}: {
  section: PageSection;
  layout: Required<SectionLayout>;
}) {
  return (
    <div className="w-full">
      <CopyBlock section={section} layout={layout} />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {LICENSE_TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`relative flex flex-col rounded-2xl border p-6 ${tier.highlight ? "border-vb-purple bg-vb-purple/10 glow-purple" : "border-white/[0.06] bg-vb-ink"}`}
          >
            {tier.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-vb-purple px-3 py-1 font-sub text-xs uppercase tracking-wider text-white">
                {tier.badge}
              </span>
            )}
            <h3 className="font-display text-2xl uppercase text-chrome">{tier.name}</h3>
            <p className="mt-1 min-h-10 font-body text-sm text-vb-muted">{tier.blurb}</p>
            <p className="mt-3 font-display text-4xl text-chrome">{formatCad(tier.priceCents)}</p>
            <ul className="mt-5 flex-1 space-y-2">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-2 font-body text-sm text-vb-silver/80">
                  <Check size={15} className="mt-0.5 shrink-0 text-vb-purple-bright" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/beats"
              className={`mt-6 rounded-xl py-3 text-center font-sub uppercase tracking-wider ${tier.highlight ? "bg-vb-purple text-white hover:bg-vb-purple-bright" : "border border-white/15 hover:border-vb-purple/60"}`}
            >
              Browse Beats
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function LicenseComparison({ section }: { section: PageSection }) {
  const rows: { label: string; values: (string | boolean)[] }[] = [
    {
      label: "File Format",
      values: ["Tagged MP3", "Untagged MP3", "WAV + MP3", "WAV+MP3+Stems", "WAV+MP3+Stems"],
    },
    {
      label: "Streams",
      values: ["—", "10,000", "50,000", "Unlimited", "Unlimited"],
    },
    {
      label: "Sold Copies",
      values: ["—", "2,000", "10,000", "Unlimited", "Unlimited"],
    },
    { label: "Monetization", values: [false, true, true, true, true] },
    {
      label: "Exclusive Ownership",
      values: [false, false, false, false, true],
    },
  ];
  return (
    <div className="w-full">
      <h2 className="mb-10 text-center font-display text-5xl uppercase text-chrome">
        {section.title || "Compare Licenses"}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-vb-ink">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="p-4 font-sub uppercase tracking-wider text-vb-muted">Feature</th>
              {LICENSE_TIERS.map((tier) => (
                <th key={tier.id} className="p-4 text-center font-display text-xl uppercase">
                  {tier.name.replace(" License", "").replace(" Lease", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-white/[0.04]">
                <td className="p-4 font-body text-vb-silver">{row.label}</td>
                {row.values.map((value, index) => (
                  <td key={index} className="p-4 text-center font-body">
                    {typeof value === "boolean" ? (
                      value ? (
                        <Check size={18} className="inline text-vb-purple-bright" />
                      ) : (
                        <span className="text-vb-muted">—</span>
                      )
                    ) : (
                      <span className="text-vb-silver/90">{value}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Actions({ section }: { section: PageSection }) {
  if (!section.ctaLabel || !section.ctaHref) return null;
  return (
    <div className="mt-8 flex flex-wrap gap-4">
      <ActionLink href={section.ctaHref} label={section.ctaLabel} primary />
      {section.secondaryCtaLabel && section.secondaryCtaHref && (
        <ActionLink href={section.secondaryCtaHref} label={section.secondaryCtaLabel} />
      )}
    </div>
  );
}
function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  const className = `page-action inline-flex items-center gap-2 rounded-xl px-6 py-3 font-sub uppercase tracking-wider transition ${primary ? "bg-vb-purple text-white hover:bg-vb-purple-bright" : "border border-white/15 text-vb-silver-bright hover:border-vb-purple/60"}`;
  return href.startsWith("/") ? (
    <Link to={href} className={className}>
      {label}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label}
      <ExternalLink size={15} />
    </a>
  );
}

function embedUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (url.hostname === "youtu.be")
      return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
    return "";
  } catch {
    return "";
  }
}
function setMeta(attribute: "name" | "property", key: string, value: string) {
  let element = document.head.querySelector(
    `meta[${attribute}="${key}"]`,
  ) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = value;
}
