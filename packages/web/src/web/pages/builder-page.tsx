import { Link, useRoute } from "wouter";
import { Download, ExternalLink, FileText } from "lucide-react";
import { Layout } from "../components/layout";
import { FourthwallMerch } from "../components/fourthwall-merch";
import { useSiteSettings } from "../lib/site-settings";
import type { PageSection } from "../../shared/site-settings";

function CallToAction({ section }: { section: PageSection }) {
  if (!section.ctaLabel || !section.ctaHref) return null;
  const className =
    "inline-flex items-center gap-2 rounded-lg bg-vb-purple px-5 py-3 font-sub uppercase tracking-wider text-white transition hover:bg-vb-purple-bright";
  return section.ctaHref.startsWith("/") ? (
    <Link to={section.ctaHref} className={className}>
      {section.ctaLabel} <ExternalLink size={16} />
    </Link>
  ) : (
    <a href={section.ctaHref} target="_blank" rel="noreferrer" className={className}>
      {section.ctaLabel} <ExternalLink size={16} />
    </a>
  );
}

function BuilderSection({
  section,
  currency,
  shopDomain,
}: {
  section: PageSection;
  currency: string;
  shopDomain: string;
}) {
  if (section.type === "hero") {
    return (
      <section className="relative overflow-hidden border-b border-white/[0.06] bg-vb-black px-5 py-28 sm:px-8 sm:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(124,47,203,0.22),transparent_35%)]" />
        <div className="relative mx-auto max-w-5xl">
          {section.eyebrow && (
            <p className="font-sub uppercase tracking-[0.28em] text-vb-purple-bright">
              {section.eyebrow}
            </p>
          )}
          <h1 className="mt-4 max-w-4xl font-display text-6xl uppercase leading-[0.85] text-chrome sm:text-8xl">
            {section.title}
          </h1>
          {section.body && (
            <p className="mt-7 max-w-2xl font-body text-lg text-vb-silver/70">{section.body}</p>
          )}
          <div className="mt-8">
            <CallToAction section={section} />
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "image") {
    return section.imageUrl ? (
      <section className="bg-vb-black px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/[0.08]">
          <img
            src={section.imageUrl}
            alt={section.title || "Vylanous Beats visual"}
            loading="lazy"
            decoding="async"
            className="w-full object-cover"
          />
        </div>
      </section>
    ) : null;
  }

  if (section.type === "merch") {
    return (
      <section className="bg-vb-black px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="font-sub uppercase tracking-[0.25em] text-vb-purple-bright">Merchandise</p>
          <h2 className="mt-3 font-display text-5xl uppercase text-chrome sm:text-6xl">
            {section.title || "Latest drop"}
          </h2>
          {section.body && (
            <p className="mt-4 max-w-2xl font-body text-vb-silver/65">{section.body}</p>
          )}
          <div className="mt-9">
            <FourthwallMerch
              collection={section.collection}
              currency={currency}
              shopDomain={shopDomain}
            />
          </div>
        </div>
      </section>
    );
  }

  const icon = section.type === "pressKit" ? <FileText size={20} /> : <Download size={20} />;
  return (
    <section className="bg-vb-ink px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {section.type === "pressKit" && (
          <div className="mb-5 inline-grid h-11 w-11 place-items-center rounded-xl bg-vb-purple/15 text-vb-purple-bright">
            {icon}
          </div>
        )}
        <h2 className="font-display text-5xl uppercase text-chrome sm:text-6xl">{section.title}</h2>
        {section.body && (
          <p className="mt-5 whitespace-pre-line font-body text-lg leading-relaxed text-vb-silver/70">
            {section.body}
          </p>
        )}
        <div className="mt-8">
          <CallToAction section={section} />
        </div>
      </div>
    </section>
  );
}

export default function BuilderPage() {
  const [, params] = useRoute("/:slug");
  const { pages, fourthwall } = useSiteSettings();
  const page = pages.find((candidate) => candidate.slug === params?.slug && candidate.published);

  if (!page) {
    return (
      <Layout>
        <div className="grid min-h-[65vh] place-items-center px-5 text-center">
          <div>
            <p className="font-sub uppercase tracking-[0.25em] text-vb-purple-bright">Not found</p>
            <h1 className="mt-3 font-display text-6xl uppercase text-chrome">Page unavailable</h1>
            <Link
              to="/"
              className="mt-6 inline-block font-sub uppercase tracking-wider text-vb-silver-bright hover:text-vb-purple-bright"
            >
              Return home →
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {page.sections.map((section) => (
        <BuilderSection
          key={section.id}
          section={section}
          currency={fourthwall.currency}
          shopDomain={fourthwall.shopDomain}
        />
      ))}
    </Layout>
  );
}
