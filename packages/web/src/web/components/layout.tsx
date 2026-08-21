/** Vylanous shared chrome: dark industrial foundation with optional page-level builder controls. */
import { Nav } from "./nav";
import { Footer } from "./footer";
import { CartDrawer } from "./cart-drawer";
import { PlayerBar } from "./player-bar";
import { NewsletterPopup } from "./newsletter-popup";
import { usePlayer } from "../lib/player";
import { useSiteSettings } from "../lib/site-settings";
import { builderPagePath, normalizeManagedPath } from "../lib/page-routes";
import type { PageLayout } from "../../shared/site-settings";

export function Layout({
  children,
  showHeader = true,
  showFooter = true,
  pageBackground = "default",
  pageStyle,
}: {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  pageBackground?: "default" | "mesh" | "ink";
  pageStyle?: PageLayout;
}) {
  const { current } = usePlayer();
  const settings = useSiteSettings();
  const activePath =
    typeof window === "undefined"
      ? "/"
      : normalizeManagedPath(window.location.pathname);
  const activePage = settings.pages.find(
    (page) => builderPagePath(page) === activePath,
  );
  const announcement = settings.announcementBanner;
  const showAnnouncement =
    announcement.enabled &&
    Boolean(announcement.message.trim()) &&
    (announcement.target === "all" ||
      Boolean(activePage && announcement.pageIds.includes(activePage.id)));
  const background =
    pageBackground === "mesh"
      ? "bg-mesh"
      : pageBackground === "ink"
        ? "bg-vb-ink"
        : "";
  const pageVars = {
    "--page-primary":
      pageStyle?.primaryColor ||
      (pageStyle?.inheritTheme === false ? "#D94A4A" : undefined),
    ...(pageStyle?.backgroundColor
      ? { "--page-background": pageStyle.backgroundColor }
      : {}),
    ...(pageStyle?.textColor ? { "--page-text": pageStyle.textColor } : {}),
    ...(pageStyle?.mutedColor ? { "--page-muted": pageStyle.mutedColor } : {}),
    ...(pageStyle?.surfaceColor
      ? { "--page-surface": pageStyle.surfaceColor }
      : {}),
    ...(pageStyle?.borderColor
      ? { "--page-border": pageStyle.borderColor }
      : {}),
    ...(pageStyle?.backgroundImage
      ? {
          "--page-background-image": `url("${pageStyle.backgroundImage.replace(/"/g, "%22")}")`,
        }
      : {}),
    ...(pageStyle?.eyebrowColor
      ? { "--page-eyebrow": pageStyle.eyebrowColor }
      : {}),
    ...(pageStyle?.linkColor ? { "--page-link": pageStyle.linkColor } : {}),
    "--page-background-overlay":
      pageStyle?.backgroundOverlay === "strong"
        ? "rgba(5, 4, 8, 0.78)"
        : pageStyle?.backgroundOverlay === "medium"
          ? "rgba(5, 4, 8, 0.56)"
          : pageStyle?.backgroundOverlay === "soft"
            ? "rgba(5, 4, 8, 0.28)"
            : "transparent",
  } as React.CSSProperties;
  const chromeClasses = [
    pageStyle?.chrome?.header ? "page-chrome-header" : "",
    pageStyle?.chrome?.navigation ? "page-chrome-navigation" : "",
    pageStyle?.chrome?.footer ? "page-chrome-footer" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      style={pageVars}
      className={`page-style ${pageStyle?.inheritTheme === false ? "page-theme-isolated" : ""} grain-fixed min-h-screen flex flex-col ${background} ${chromeClasses} page-background-fit-${pageStyle?.backgroundImageFit || "cover"} page-background-position-${pageStyle?.backgroundImagePosition || "center"} page-treatment-${pageStyle?.pageTreatment || "none"}`}
    >
      {(pageStyle?.backgroundImage || pageStyle?.pageTreatment !== "none") && (
        <>
          <div className="page-background-media" aria-hidden="true" />
          <div className="page-background-overlay" aria-hidden="true" />
          <div className="page-background-treatment" aria-hidden="true" />
        </>
      )}
      {showHeader && <Nav />}
      {showAnnouncement && <AnnouncementBanner {...announcement} />}
      <main className={`min-w-0 w-full flex-1 ${current ? "pb-20" : ""}`}>
        {children}
      </main>
      {showFooter && <Footer />}
      <CartDrawer />
      <PlayerBar />
      <NewsletterPopup />
    </div>
  );
}

function AnnouncementBanner({
  message,
  ctaLabel,
  ctaHref,
  tone,
}: {
  message: string;
  ctaLabel: string;
  ctaHref: string;
  tone: "accent" | "sale" | "notice";
}) {
  const tones = {
    accent: "border-vb-purple/35 bg-vb-purple/[0.13] text-vb-silver-bright",
    sale: "border-amber-300/35 bg-amber-300/[0.12] text-amber-50",
    notice: "border-cyan-300/30 bg-cyan-300/[0.1] text-cyan-50",
  };
  return (
    <aside
      className={`relative z-10 border-y px-5 py-3 ${tones[tone]}`}
      aria-label="Site announcement"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
        <p className="font-sub text-xs uppercase tracking-[0.14em]">
          {message}
        </p>
        {ctaLabel && ctaHref && (
          <a
            href={ctaHref}
            className="shrink-0 rounded-full border border-current/40 px-3 py-1 font-sub text-[10px] uppercase tracking-[0.14em] transition hover:bg-white/15"
          >
            {ctaLabel} →
          </a>
        )}
      </div>
    </aside>
  );
}
