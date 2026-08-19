/** Vylanous shared chrome: dark industrial foundation with optional page-level builder controls. */
import { Nav } from "./nav";
import { Footer } from "./footer";
import { CartDrawer } from "./cart-drawer";
import { PlayerBar } from "./player-bar";
import { NewsletterPopup } from "./newsletter-popup";
import { usePlayer } from "../lib/player";
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
  const background =
    pageBackground === "mesh" ? "bg-mesh" : pageBackground === "ink" ? "bg-vb-ink" : "";
  const pageVars = {
    ...(pageStyle?.primaryColor ? { "--page-primary": pageStyle.primaryColor } : {}),
    ...(pageStyle?.backgroundColor ? { "--page-background": pageStyle.backgroundColor } : {}),
    ...(pageStyle?.backgroundImage
      ? {
          "--page-background-image": `url("${pageStyle.backgroundImage.replace(/"/g, "%22")}")`,
        }
      : {}),
    ...(pageStyle?.eyebrowColor ? { "--page-eyebrow": pageStyle.eyebrowColor } : {}),
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
  ].filter(Boolean).join(" ");
  return (
    <div
      style={pageVars}
      className={`page-style grain-fixed min-h-screen flex flex-col ${background} ${chromeClasses} page-background-fit-${pageStyle?.backgroundImageFit || "cover"} page-background-position-${pageStyle?.backgroundImagePosition || "center"} page-treatment-${pageStyle?.pageTreatment || "none"}`}
    >
      {(pageStyle?.backgroundImage || pageStyle?.pageTreatment !== "none") && (
        <>
          <div className="page-background-media" aria-hidden="true" />
          <div className="page-background-overlay" aria-hidden="true" />
          <div className="page-background-treatment" aria-hidden="true" />
        </>
      )}
      {showHeader && <Nav />}
      <main className={`flex-1 ${current ? "pb-20" : ""}`}>{children}</main>
      {showFooter && <Footer />}
      <CartDrawer />
      <PlayerBar />
      <NewsletterPopup />
    </div>
  );
}
