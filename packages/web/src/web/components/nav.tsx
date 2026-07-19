import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "../lib/cart";
import { useSiteSettings } from "../lib/site-settings";

const LINKS = [
  { href: "/beats", label: "Beats" },
  { href: "/licensing", label: "Licensing" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { count, setOpen } = useCart();
  const [loc] = useLocation();
  const { brand } = useSiteSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobile(false), [loc]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-vb-black/85 backdrop-blur-xl border-b border-white/[0.06]" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={brand.squareLogoUrl} alt="Vylanous Beats" className="h-9 w-9 object-contain" />
          <span className="font-display text-xl uppercase tracking-wide leading-none hidden sm:block">
            <span className="text-vb-silver-bright">Vylanous</span>{" "}
            <span className="text-purple-glow">Beats</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`font-sub uppercase text-base tracking-wider transition-colors ${
                loc === l.href ? "text-purple-glow" : "text-vb-silver hover:text-vb-silver-bright"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="relative grid place-items-center w-10 h-10 rounded-lg bg-vb-ink border border-white/10 hover:border-vb-purple/60 transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart size={18} className="text-vb-silver-bright" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-vb-purple text-white text-[11px] font-bold">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobile((v) => !v)}
            className="md:hidden grid place-items-center w-10 h-10 rounded-lg bg-vb-ink border border-white/10"
            aria-label="Menu"
          >
            {mobile ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobile && (
        <div className="md:hidden bg-vb-black/95 backdrop-blur-xl border-b border-white/[0.06]">
          <nav className="flex flex-col px-5 py-4 gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="font-sub uppercase text-xl tracking-wider py-2.5 text-vb-silver hover:text-purple-glow"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
