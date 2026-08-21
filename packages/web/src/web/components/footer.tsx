/** Vylanous footer: global chrome rendered from Site Builder footer, page, and social settings. */
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Mail, Check } from "lucide-react";
import { useSiteSettings } from "../lib/site-settings";
import { SocialIcon } from "./social-icon";
import { builderPagePath, normalizeManagedPath } from "../lib/page-routes";

export function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const { brand, footer, pages, socials } = useSiteSettings();
  const [loc] = useLocation();
  const activePage = pages.find(
    (page) => builderPagePath(page) === normalizeManagedPath(loc),
  );
  const footerLogoUrl =
    activePage?.layout?.footerLogoUrl?.trim() || brand.fullLogoUrl;
  const footerLabel = activePage?.layout?.footerLabel?.trim() || "";
  const links = useMemo(
    () =>
      [...pages]
        .filter((page) => page.published && page.showInFooter)
        .sort((a, b) => (a.navOrder ?? 1000) - (b.navOrder ?? 1000)),
    [pages],
  );
  const footerSocials = socials.filter((social) => social.showInFooter);

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setDone(true);
      setEmail("");
    } catch {
      setDone(true);
    }
  };

  return (
    <footer className="page-footer relative mt-24 border-t border-white/[0.06] bg-vb-black">
      <div className="grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-4 mx-auto">
        <div className="md:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <img
              src={footerLogoUrl}
              alt={footerLabel || "Vylanous Beats"}
              className="-ml-2 h-24 w-auto max-w-full object-contain"
            />
            {footerLabel && (
              <span className="font-display text-2xl uppercase tracking-wide text-chrome">
                {footerLabel}
              </span>
            )}
          </div>
          <p className="mt-3 max-w-sm font-body text-vb-muted">
            {footer.description}
          </p>
          <p className="mt-4 flex items-center gap-2 font-body text-sm text-vb-muted">
            <Mail size={15} className="text-vb-purple-bright" />
            <a
              href={`mailto:${footer.contactEmail}`}
              className="hover:text-vb-purple-bright"
            >
              {footer.contactEmail}
            </a>
          </p>
        </div>

        {footer.showNavigation && (
          <div>
            <h4 className="mb-4 font-sub text-lg uppercase tracking-widest text-vb-silver">
              Explore
            </h4>
            <ul className="space-y-2.5 font-body text-vb-muted">
              {links.map((page) => (
                <li key={page.id}>
                  <Link
                    to={page.path || `/${page.slug}`}
                    className="hover:text-vb-purple-bright"
                  >
                    {page.navLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {footer.showNewsletter && (
          <div>
            <h4 className="mb-4 font-sub text-lg uppercase tracking-widest text-vb-silver">
              {footer.newsletterHeading}
            </h4>
            {done ? (
              <p className="flex items-center gap-2 font-body text-vb-purple-bright">
                <Check size={16} /> You're on the list.
              </p>
            ) : (
              <form onSubmit={subscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  aria-label="Email address for new beat releases"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your@email.com"
                  className="rounded-lg border border-white/10 bg-vb-ink px-3 py-2.5 font-body text-sm outline-none focus:border-vb-purple"
                />
                <button className="rounded-lg bg-vb-purple py-2.5 font-sub uppercase tracking-wider text-white transition hover:bg-vb-purple-bright">
                  {footer.newsletterButton}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 font-body text-sm text-vb-muted sm:flex-row sm:px-8 mx-auto">
          <p>
            © {new Date().getFullYear()} Vylanous Beats. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {footerSocials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-sub uppercase tracking-wider hover:text-vb-purple-bright"
                aria-label={social.label}
              >
                <SocialIcon platform={social.platform} size={15} />
                <span>{social.label}</span>
              </a>
            ))}
            <p className="font-sub uppercase tracking-wider">
              {footer.legalLine}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
