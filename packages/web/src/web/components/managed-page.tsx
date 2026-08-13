/**
 * Vylanous Site Builder renderer: translates saved page blocks and layout
 * decisions into the public music storefront without sacrificing commerce flows.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, ExternalLink, Search, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "./layout";
import { BeatCard } from "./beat-card";
import { FourthwallMerch } from "./fourthwall-merch";
import { Marquee } from "./marquee";
import { api } from "../lib/api";
import { useSiteSettings } from "../lib/site-settings";
import { LICENSE_TIERS, formatCad } from "../../shared/licenses";
import type { Beat } from "../../api/database/schema";
import type { BuilderPage, PageSection, SectionLayout } from "../../shared/site-settings";

const WIDTH: Record<NonNullable<SectionLayout["width"]>, string> = {
  narrow: "max-w-2xl",
  standard: "max-w-4xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};
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
};

function usePageMetadata(page: BuilderPage | undefined) {
  useEffect(() => {
    if (!page) return;
    const title = page.seo?.title || `${page.title} | Vylanous Beats`;
    const description =
      page.seo?.description || page.sections.find((section) => section.body)?.body || "";
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
  const page = pages.find(
    (candidate) => (candidate.path || `/${candidate.slug}`) === path && candidate.published,
  );
  usePageMetadata(page);
  if (!page) return <UnavailablePage />;
  return (
    <Layout
      showHeader={page.layout?.showHeader !== false}
      showFooter={page.layout?.showFooter !== false}
      pageBackground={page.layout?.background}
    >
      {page.sections.map((section) => (
        <BuilderSection
          key={section.id}
          section={section}
          currency={fourthwall.currency}
          shopDomain={fourthwall.shopDomain}
        />
      ))}
    </Layout>
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
  currency,
  shopDomain,
}: {
  section: PageSection;
  currency: string;
  shopDomain: string;
}) {
  const layout = { ...DEFAULT_LAYOUT, ...section.layout };
  if (section.type === "marquee") return <Marquee text={section.title || "VYLANOUS BEATS"} />;
  if (section.type === "divider")
    return (
      <div
        className={`mx-auto h-px ${WIDTH[layout.width]} bg-gradient-to-r from-transparent via-vb-purple/70 to-transparent`}
      />
    );
  if (section.type === "spacer")
    return <div aria-hidden="true" className={SPACING[layout.spacing]} />;
  return (
    <section className={SURFACE[layout.surface]}>
      <div
        className={`relative mx-auto flex ${WIDTH[layout.width]} ${SPACING[layout.spacing]} flex-col px-5 sm:px-8 ${ALIGNMENT[layout.alignment]}`}
      >
        {section.type === "hero" && <HeroSection section={section} layout={layout} />}
        {section.type === "text" && <CopySection section={section} layout={layout} />}
        {section.type === "image" && <ImageSection section={section} layout={layout} />}
        {section.type === "video" && <VideoSection section={section} layout={layout} />}
        {section.type === "gallery" && <GallerySection section={section} layout={layout} />}
        {section.type === "featureCards" && <FeatureCards section={section} layout={layout} />}
        {section.type === "callout" && <CalloutSection section={section} layout={layout} />}
        {section.type === "pressKit" && <CopySection section={section} layout={layout} icon />}
        {section.type === "merch" && (
          <MerchSection section={section} currency={currency} shopDomain={shopDomain} />
        )}
        {section.type === "featuredBeats" && <FeaturedBeats section={section} layout={layout} />}
        {section.type === "beatCatalog" && <BeatCatalog />}
        {section.type === "licenseTiers" && <LicenseTiers section={section} layout={layout} />}
        {section.type === "licenseComparison" && <LicenseComparison section={section} />}
      </div>
    </section>
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
        <p className="font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg">
          {section.eyebrow}
        </p>
      )}
      <Heading
        className={`mt-3 whitespace-pre-line font-display uppercase leading-[0.88] ${heading === "h1" ? "text-6xl sm:text-8xl" : "text-5xl sm:text-6xl"} ${emphasis}`}
      >
        {section.title}
      </Heading>
      {section.body && (
        <p className="mt-5 max-w-2xl whitespace-pre-line font-body text-lg leading-relaxed text-vb-silver/70">
          {section.body}
        </p>
      )}
      <Actions section={section} />
    </div>
  );
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
                section={{ ...section, imageUrl: item.imageUrl, title: item.title }}
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

function BeatCatalog() {
  const { data, isLoading } = useQuery({
    queryKey: ["beats", "all"],
    queryFn: async () => (await api.beats.$get()).json(),
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
    { label: "Streams", values: ["—", "10,000", "50,000", "Unlimited", "Unlimited"] },
    { label: "Sold Copies", values: ["—", "2,000", "10,000", "Unlimited", "Unlimited"] },
    { label: "Monetization", values: [false, true, true, true, true] },
    { label: "Exclusive Ownership", values: [false, false, false, false, true] },
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
  const className = `inline-flex items-center gap-2 rounded-xl px-6 py-3 font-sub uppercase tracking-wider transition ${primary ? "bg-vb-purple text-white hover:bg-vb-purple-bright" : "border border-white/15 text-vb-silver-bright hover:border-vb-purple/60"}`;
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
