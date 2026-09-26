/** Vylanous gateway: split-screen entry at the domain root.
 *  Chooses between the Beats store and the Artist page.
 *  Uses generic header/footer chrome (no social links, support email kept)
 *  so nothing on this page is specific to either destination.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Mail } from "lucide-react";
import { Layout } from "../components/layout";
import { Marquee } from "../components/marquee";
import { useSiteSettings } from "../lib/site-settings";

const BEATS_URL = "/home/vylanous-beats";
const ARTIST_URL = "/home/artist";
const BEATS_LOGO = "/brand/Logo_full_transparent.png";
const ARTIST_LOGO = "/brand/Logo_skull_transparent.png";

export default function Index() {
  const { footer } = useSiteSettings();
  const contactEmail = footer.contactEmail?.trim() || "support@vylanous.com";

  useEffect(() => {
    document.title = "Vylanous | Home";
  }, []);

  return (
    <Layout showHeader={false} showFooter={false} pageBackground="mesh">
      <GatewayHeader />
      <section className="relative px-5 pb-10 pt-14 text-center sm:px-8 sm:pt-20">
        <p className="font-sub text-lg uppercase tracking-[0.3em] text-vb-purple-bright">
          The home for everything Vylanous
        </p>
        <h1 className="mx-auto mt-4 max-w-4xl font-display text-6xl uppercase leading-[0.9] text-chrome sm:text-8xl">
          One name.
          <br />
          <span className="text-purple-glow">Two worlds.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-vb-silver/70">
          Step into the beat store to find your next sound, or into the artist's world to follow
          the music and the story behind it.
        </p>
      </section>

      <div className="my-4">
        <Marquee text="Vylanous Beats — Vylanous Artist" />
      </div>

      <section
        aria-label="Choose your destination"
        className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-14 sm:px-8 md:grid-cols-2"
      >
        <DestinationCard
          logo={BEATS_LOGO}
          logoAlt="Vylanous Beats logo"
          title="Vylanous Beats"
          blurb="Premium hip-hop beats. Lease or own — instant delivery, clear licensing."
          cta="Enter the store"
          href={BEATS_URL}
          primary
        />
        <DestinationCard
          logo={ARTIST_LOGO}
          logoAlt="Vylanous Artist logo"
          title="Vylanous Artist"
          blurb="The artist behind the sound. Music, story, and what's coming next."
          cta="Enter the artist page"
          href={ARTIST_URL}
        />
      </section>

      <GatewayFooter contactEmail={contactEmail} />
    </Layout>
  );
}

function DestinationCard({
  logo,
  logoAlt,
  title,
  blurb,
  cta,
  href,
  primary = false,
}: {
  logo: string;
  logoAlt: string;
  title: string;
  blurb: string;
  cta: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={href}
      className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-vb-ink/80 px-8 py-12 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-vb-purple/60 hover:shadow-[0_20px_70px_rgba(124,47,203,0.35)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-vb-purple/[0.08] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <img
        src={logo}
        alt={logoAlt}
        loading="eager"
        decoding="async"
        className="relative h-28 w-auto max-w-full object-contain drop-shadow-[0_0_25px_rgba(124,47,203,0.35)]"
      />
      <h2 className="relative mt-6 font-display text-4xl uppercase tracking-wide text-chrome">
        {title}
      </h2>
      <p className="relative mt-3 max-w-xs font-body leading-relaxed text-vb-silver/70">{blurb}</p>
      <span
        className={`relative mt-8 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-sub text-base uppercase tracking-[0.14em] transition ${
          primary
            ? "bg-vb-purple text-white group-hover:bg-vb-purple-bright"
            : "border border-white/15 text-vb-silver-bright group-hover:border-vb-purple-bright group-hover:text-white"
        }`}
      >
        {cta}
        <ArrowRight
          size={17}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

function GatewayHeader() {
  return (
    <header className="relative z-10 border-b border-white/[0.06] bg-vb-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-center px-5 sm:px-8">
        <span className="flex items-center gap-2.5">
          <img
            src="/brand/Logo_skull_transparent.png"
            alt="Vylanous"
            fetchPriority="high"
            decoding="async"
            className="h-9 w-9 object-contain"
          />
          <span className="font-display text-xl uppercase tracking-wide text-vb-silver-bright">
            Vylanous
          </span>
        </span>
      </div>
    </header>
  );
}

function GatewayFooter({ contactEmail }: { contactEmail: string }) {
  return (
    <footer className="relative mt-16 border-t border-white/[0.06] bg-vb-black/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-10 text-center sm:px-8">
        <a
          href={`mailto:${contactEmail}`}
          className="inline-flex items-center gap-2 font-body text-vb-silver transition hover:text-vb-purple-bright"
        >
          <Mail size={16} className="text-vb-purple-bright" />
          {contactEmail}
        </a>
        <div className="flex items-center gap-5 font-sub text-xs uppercase tracking-[0.18em] text-vb-muted">
          <Link to="/privacy" className="transition hover:text-vb-purple-bright">
            Privacy
          </Link>
          <Link to="/terms" className="transition hover:text-vb-purple-bright">
            Terms
          </Link>
        </div>
        <p className="font-body text-sm text-vb-muted">
          © {new Date().getFullYear()} Vylanous. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
