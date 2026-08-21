/** Vylanous navigation: global chrome rendered from Site Builder header, social, and page settings. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, UserRound, LogOut, Trash2 } from "lucide-react";
import { useCart } from "../lib/cart";
import { useSiteSettings } from "../lib/site-settings";
import { useCustomer } from "../lib/customer";
import { SocialIcon } from "./social-icon";
import { builderPagePath, normalizeManagedPath } from "../lib/page-routes";
import { formatCad } from "../../shared/licenses";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { count, open: cartOpen, setOpen: setCartOpen } = useCart();
  const { customer, signOut } = useCustomer();
  const [loc] = useLocation();
  const { brand, header, pages, socials } = useSiteSettings();
  const activePath = normalizeManagedPath(
    loc || (typeof window !== "undefined" ? window.location.pathname : "/"),
  );
  const activePage = useMemo(
    () => pages.find((page) => builderPagePath(page) === activePath),
    [pages, activePath],
  );
  const pageHeaderLogo = activePage?.layout?.headerLogoUrl?.trim() || "";
  const headerLogoUrl = pageHeaderLogo || brand.squareLogoUrl;
  const pageHeaderLabel = activePage?.layout?.headerLabel?.trim() || "";
  const pageWordmark = activePage?.layout?.wordmark?.trim() || "";
  const headerLogoHref = activePage?.layout?.headerLogoHref?.trim() || "/";
  const pageWordmarkAccent = activePage?.layout?.wordmarkAccent?.trim() || "";
  const pageWordmarkAccentColor =
    activePage?.layout?.wordmarkAccentColor ||
    activePage?.layout?.primaryColor ||
    "#7C2FCB";
  const headerActions = activePage?.layout?.headerActions;
  const showVault = headerActions?.showVault !== false;
  const vaultLabel = headerActions?.vaultLabel?.trim() || "Vault";
  const vaultHref = headerActions?.vaultHref?.trim() || "/dashboard";
  const showSignIn = headerActions?.showSignIn !== false;
  const signInLabel = headerActions?.signInLabel?.trim() || "Sign in";
  const signInHref = headerActions?.signInHref?.trim() || "/login";
  // Keep one reliable cart entry point on every page. Historical page settings
  // could persist `showCart: false` and make the cart appear broken by removing
  // the only trigger, so the header cart is intentionally always available.
  const showCart = true;
  const wordmarkAccentIndex =
    pageWordmark && pageWordmarkAccent
      ? pageWordmark.lastIndexOf(pageWordmarkAccent)
      : -1;
  const wordmarkBase =
    wordmarkAccentIndex >= 0
      ? pageWordmark.slice(0, wordmarkAccentIndex).trimEnd()
      : pageWordmark;
  const links = useMemo(
    () =>
      [...pages]
        .filter(
          (page) =>
            page.published &&
            page.showInNav &&
            page.navLabel.trim().toLowerCase() !== "all beats",
        )
        .sort((a, b) => (a.navOrder ?? 1000) - (b.navOrder ?? 1000))
        .map((page) => ({
          href: page.path || `/${page.slug}`,
          label: page.navLabel,
        })),
    [pages],
  );
  const pageHeaderSocialIds = activePage?.layout?.headerSocialIds;
  const universalHeaderSocials = socials.filter(
    (social) =>
      social.showInHeader &&
      (pageHeaderSocialIds === undefined ||
        pageHeaderSocialIds.includes(social.id)),
  );
  const pageHeaderSocials =
    activePage?.layout?.pageSocialLinks?.filter(
      (social) => social.showInHeader !== false && social.url.trim(),
    ) || [];
  const headerSocials = [...universalHeaderSocials, ...pageHeaderSocials];
  const opaque = !header.transparentAtTop || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setMobile(false), [loc]);

  const chromeClass = header.sticky
    ? "fixed top-0 inset-x-0 z-50"
    : "relative z-50";
  return (
    <header
      className={`page-header ${chromeClass} transition-all duration-300 ${opaque ? "bg-vb-black/85 backdrop-blur-xl border-b border-white/[0.06]" : "bg-transparent"}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          to={headerLogoHref}
          className="flex shrink-0 items-center gap-2.5"
        >
          <img
            src={headerLogoUrl}
            alt={pageHeaderLabel || pageWordmark || "Vylanous Beats"}
            fetchPriority="high"
            decoding="async"
            className="h-9 w-9 object-contain"
          />
          {header.showWordmark && (
            <span className="font-display text-lg uppercase leading-none tracking-wide sm:text-xl">
              {pageHeaderLabel ? (
                <span className="text-vb-silver-bright">{pageHeaderLabel}</span>
              ) : pageWordmark ? (
                <>
                  <span className="text-vb-silver-bright">{wordmarkBase}</span>{" "}
                  {wordmarkAccentIndex >= 0 && (
                    <span style={{ color: pageWordmarkAccentColor }}>
                      {pageWordmarkAccent}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-vb-silver-bright">Vylanous</span>{" "}
                  <span className="text-purple-glow">Beats</span>
                </>
              )}
            </span>
          )}
        </Link>
        <nav className="page-navigation hidden items-center gap-6 lg:flex">
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
        <div className="flex min-w-0 shrink-0 items-center gap-2">
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
              {showVault && (
                <AccountAction
                  href={vaultHref}
                  label={vaultLabel}
                  icon={<UserRound size={14} />}
                />
              )}
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="hidden rounded-lg border border-white/10 p-2 text-vb-silver hover:border-vb-purple hover:text-white xl:inline-flex"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : showSignIn ? (
            <HeaderAction href={signInHref} label={signInLabel} />
          ) : null}
          {showCart && (
            <CartDropdown count={count} open={cartOpen} setOpen={setCartOpen} />
          )}
          <button
            onClick={() => setMobile((value) => !value)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-vb-ink lg:hidden"
            aria-label="Menu"
          >
            {mobile ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {mobile && (
        <div className="border-b border-white/[0.06] bg-vb-black/95 backdrop-blur-xl lg:hidden">
          <nav className="page-navigation flex flex-col gap-1 px-5 py-4">
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
                <HeaderAction
                  href={header.ctaHref}
                  label={header.ctaLabel}
                  mobile
                />
              )}
            {customer ? (
              <>
                {showVault && (
                  <AccountAction href={vaultHref} label={vaultLabel} mobile />
                )}
                <button
                  onClick={() => signOut()}
                  className="mt-1 w-fit py-2 font-sub text-sm uppercase tracking-wide text-vb-silver/60 hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : showSignIn ? (
              <HeaderAction href={signInHref} label={signInLabel} mobile />
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}

function CartDropdown({
  count,
  open,
  setOpen,
}: {
  count: number;
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const { items, remove, totalCents } = useCart();
  const [localOpen, setLocalOpen] = useState(false);
  const visible = localOpen || open;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setLocalOpen(false);
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLocalOpen(false);
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [visible, setOpen]);

  return (
    <div ref={rootRef} className="relative z-[60] shrink-0">
      <button
        type="button"
        onClick={() => {
          const next = !visible;
          setLocalOpen(next);
          setOpen(next);
        }}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-vb-ink hover:border-vb-purple/60"
        aria-label={`Cart${count ? `, ${count} item${count === 1 ? "" : "s"}` : ", empty"}`}
        aria-expanded={visible}
        aria-haspopup="dialog"
      >
        <ShoppingCart size={18} className="text-vb-silver-bright" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-vb-purple px-1 text-[11px] font-bold text-white">
            {count}
          </span>
        )}
      </button>
      {visible && (
        <section
          aria-label="Cart contents"
          className="fixed right-4 top-20 z-[9999] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-vb-ink shadow-2xl shadow-black/50 md:right-8"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <h2 className="font-sub text-sm uppercase tracking-[0.16em] text-vb-silver-bright">
              Your cart
            </h2>
            <span className="font-body text-xs text-vb-silver/45">
              {count} item{count === 1 ? "" : "s"}
            </span>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="font-body text-sm text-vb-silver/55">
                Your cart is empty.
              </p>
              <Link
                to="/beats"
                onClick={() => {
                  setLocalOpen(false);
                  setOpen(false);
                }}
                className="mt-2 inline-block font-sub text-xs uppercase tracking-wide text-vb-purple-bright hover:underline"
              >
                Browse beats
              </Link>
            </div>
          ) : (
            <>
              <ul className="max-h-72 divide-y divide-white/[0.06] overflow-y-auto">
                {items.map((item) => (
                  <li
                    key={`${item.beatId}-${item.tier}`}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <img
                      src={item.artworkUrl || "/brand/Favicon_sharp.png"}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm text-vb-silver-bright">
                        {item.beatTitle}
                      </p>
                      <p className="truncate font-sub text-[10px] uppercase tracking-wide text-vb-silver/45">
                        {item.tierName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-display text-base text-chrome">
                        {formatCad(item.priceCents)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(item.beatId, item.tier)}
                        className="grid h-8 w-8 place-items-center rounded-md text-vb-silver/45 hover:bg-red-500/10 hover:text-red-300"
                        aria-label={`Remove ${item.beatTitle} from cart`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/[0.07] px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-sub text-xs uppercase tracking-wide text-vb-silver/55">
                    Total
                  </span>
                  <span className="font-display text-xl text-chrome">
                    {formatCad(totalCents)} CAD
                  </span>
                </div>
                <Link
                  to="/cart"
                  onClick={() => {
                    setLocalOpen(false);
                    setOpen(false);
                  }}
                  className="block w-full rounded-lg bg-vb-purple px-4 py-3 text-center font-sub text-sm uppercase tracking-widest text-white transition hover:bg-vb-purple-bright"
                >
                  Buy Now
                </Link>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function AccountAction({
  href,
  label,
  icon,
  mobile = false,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  mobile?: boolean;
}) {
  const className = mobile
    ? "mt-2 inline-flex w-fit items-center gap-2 py-2.5 font-sub text-xl uppercase tracking-wider text-vb-silver hover:text-purple-glow"
    : "hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-sub text-xs uppercase tracking-wide text-vb-silver hover:border-vb-purple hover:text-white xl:inline-flex";
  const content = (
    <>
      {icon}
      {label}
    </>
  );
  return href.startsWith("/") ? (
    <Link to={href} className={className}>
      {content}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
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
