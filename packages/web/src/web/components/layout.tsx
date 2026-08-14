/** Vylanous shared chrome: dark industrial foundation with optional page-level builder controls. */
import { Nav } from "./nav";
import { Footer } from "./footer";
import { CartDrawer } from "./cart-drawer";
import { PlayerBar } from "./player-bar";
import { usePlayer } from "../lib/player";

export function Layout({
  children,
  showHeader = true,
  showFooter = true,
  pageBackground = "default",
}: {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  pageBackground?: "default" | "mesh" | "ink";
}) {
  const { current } = usePlayer();
  const background =
    pageBackground === "mesh" ? "bg-mesh" : pageBackground === "ink" ? "bg-vb-ink" : "";
  return (
    <div className={`grain-fixed min-h-screen flex flex-col ${background}`}>
      {showHeader && <Nav />}
      <main className={`flex-1 ${current ? "pb-20" : ""}`}>{children}</main>
      {showFooter && <Footer />}
      <CartDrawer />
      <PlayerBar />
    </div>
  );
}
