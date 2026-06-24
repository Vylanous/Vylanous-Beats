import { Nav } from "./nav";
import { Footer } from "./footer";
import { CartDrawer } from "./cart-drawer";
import { PlayerBar } from "./player-bar";
import { usePlayer } from "../lib/player";

export function Layout({ children }: { children: React.ReactNode }) {
  const { current } = usePlayer();
  return (
    <div className="grain-fixed min-h-screen flex flex-col">
      <Nav />
      <main className={`flex-1 ${current ? "pb-20" : ""}`}>{children}</main>
      <Footer />
      <CartDrawer />
      <PlayerBar />
    </div>
  );
}
