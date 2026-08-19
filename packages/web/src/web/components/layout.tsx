/** Vylanous shared chrome: dark industrial foundation with optional page-level builder controls. */
import { Nav } from "./nav";
import { Footer } from "./footer";
import { CartDrawer } from "./cart-drawer";
import { PlayerBar } from "./player-bar";
import { NewsletterPopup } from "./newsletter-popup";
import { usePlayer } from "../lib/player";

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
  pageStyle?: {
    primaryColor?: string;
    backgroundColor?: string;
    eyebrowColor?: string;
    linkColor?: string;
    chrome?: { header?: boolean; navigation?: boolean; footer?: boolean };
  };
}) {
  const { current } = usePlayer();
  const background =
    pageBackground === "mesh" ? "bg-mesh" : pageBackground === "ink" ? "bg-vb-ink" : "";
  const pageVars = {
    ...(pageStyle?.primaryColor ? { "--page-primary": pageStyle.primaryColor } : {}),
    ...(pageStyle?.backgroundColor ? { "--page-background": pageStyle.backgroundColor } : {}),
    ...(pageStyle?.eyebrowColor ? { "--page-eyebrow": pageStyle.eyebrowColor } : {}),
    ...(pageStyle?.linkColor ? { "--page-link": pageStyle.linkColor } : {}),
  } as React.CSSProperties;
  const chromeClasses = [
    pageStyle?.chrome?.header ? "page-chrome-header" : "",
    pageStyle?.chrome?.navigation ? "page-chrome-navigation" : "",
    pageStyle?.chrome?.footer ? "page-chrome-footer" : "",
  ].filter(Boolean).join(" ");
  return (
    <div style={pageVars} className={`page-style grain-fixed min-h-screen flex flex-col ${background} ${chromeClasses}`}>
      {showHeader && <Nav />}
      <main className={`flex-1 ${current ? "pb-20" : ""}`}>{children}</main>
      {showFooter && <Footer />}
      <CartDrawer />
      <PlayerBar />
      <NewsletterPopup />
    </div>
  );
}
