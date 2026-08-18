/** Vylanous navigation: global chrome rendered from Site Builder header, social, and page settings. */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, UserRound, LogOut } from "lucide-react";
import { useCart } from "../lib/cart";
import { useSiteSettings } from "../lib/site-settings";
import { useCustomer } from "../lib/customer";
import { SocialIcon } from "./social-icon";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { count, setOpen } = useCart();
  const { customer, signOut } = useCustomer();
  const [loc] = useLocation();
  const { brand, header, pages, socials } = useSiteSettings();
  const links = useMemo(
    () =>
      [...pages]
        .filter(
          (page) =>
            page.published && page.showInNav && page.navLabel.trim().toLowerCase() !== "all beats",
        )
        .sort((a, b) => (a.navOrder ?? 1000) - (b.navOrder ?? 1000))
        .map((page) => ({ href: page.path || `/${page.slug}`, label: page.navLabel })),
    [pages],
  );
  const headerSocials = socials.filter((social) => social.showInHeader);
  const opaque = !header.transparentAtTop || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setMobile(false), [loc]);

  const chromeClass = header.sticky ? "fixed top-0 inset-x-0 z-50" : "relative z-50";
  return (
    <header
      className={`${chromeClass} transition-all duration-300 ${opaque ? "bg-vb-black/85 backdrop-blur-xl border-b border-white/[0.06]" : "bg-transparent"}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img
            src={brand.squareLogoUrl}
            alt="Vylanous Beats"
            fetchPriority="high"
            decoding="async"
            className="h-9 w-9 object-contain"
          />
          {header.showWordmark && (
            <span className="hidden font-display text-xl uppercase leading-none tracking-wide sm:block">
              <span className="text-vb-silver-bright">Vylanous</span>{" "}
              <span className="text-purple-glow">Beats</span>
            </span>
          )}
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`font-sub text-base uppercase tracking-wider transition-colors ${loc === link.href ? "text-purple-glow" : "text-vb-silver hover:text-vb-silver-bright"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {header.showSocialLinks &&
            headerSocials.slice(0, 3).map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className="hidden rounded-md px-1.5 py-1 font-sub text-xs uppercase tracking-wide text-vb-silver hover:text-vb-purple-bright xl:inline"
              >
                <SocialIcon platform={social.platform} size={15} />
                <span className="sr-only">{social.label}</span>
              </a>
            ))}
          {header.ctaLabel &&
            header.ctaHref &&
            header.ctaLabel.trim().toLowerCase() !== "all beats" && (
              <HeaderAction href={header.ctaHref} label={header.ctaLabel} />
            )}
          {customer ? (
            <>
              <Link
                to="/dashboard"
                className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-sub text-xs uppercase tracking-wide text-vb-silver hover:border-vb-purple hover:text-white xl:inline-flex"
              >
                <UserRound size={14} /> Vault
              </Link>
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="hidden rounded-lg border border-white/10 p-2 text-vb-silver hover:border-vb-purple hover:text-white xl:inline-flex"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-lg border border-vb-purple/50 px-3 py-2 font-sub text-xs uppercase tracking-wide text-vb-purple-bright hover:bg-vb-purple/10 xl:inline-flex"
            >
              Sign in
            </Link>
          )}
          {header.showCart && (
            <button
              onClick={() => setOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-vb-ink hover:border-vb-purple/60"
              aria-label="Cart"
            >
              <ShoppingCart size={18} className="text-vb-silver-bright" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-vb-purple px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setMobile((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-vb-ink lg:hidden"
            aria-label="Menu"
          >
            {mobile ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {mobile && (
        <div className="border-b border-white/[0.06] bg-vb-black/95 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1 px-5 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="py-2.5 font-sub text-xl uppercase tracking-wider text-vb-silver hover:text-purple-glow"
              >
                {link.label}
              </Link>
            ))}
            {header.ctaLabel &&
              header.ctaHref &&
              header.ctaLabel.trim().toLowerCase() !== "all beats" && (
                <HeaderAction href={header.ctaHref} label={header.ctaLabel} mobile />
              )}
            {customer ? (
              <>
                <Link
                  to="/dashboard"
                  className="mt-2 py-2.5 font-sub text-xl uppercase tracking-wider text-vb-silver hover:text-purple-glow"
                >
                  Your vault
                </Link>
                <button
                  onClick={() => signOut()}
                  className="mt-1 w-fit py-2 font-sub text-sm uppercase tracking-wide text-vb-silver/60 hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="mt-2 py-2.5 font-sub text-xl uppercase tracking-wider text-vb-purple-bright hover:text-white"
              >
                Sign in / Create account
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function HeaderAction({
  href,
  label,
  mobile = false,
}: {
  href: string;
  label: string;
  mobile?: boolean;
}) {
  const className = mobile
    ? "mt-2 inline-flex w-fit rounded-lg bg-vb-purple px-4 py-2.5 font-sub text-sm uppercase tracking-wide text-white"
    : "hidden rounded-lg bg-vb-purple px-3 py-2 font-sub text-xs uppercase tracking-wide text-white hover:bg-vb-purple-bright xl:inline-flex";
  return href.startsWith("/") ? (
    <Link to={href} className={className}>
      {label}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label}
    </a>
  );
}
