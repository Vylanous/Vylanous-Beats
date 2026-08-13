import { Link } from "wouter";
import { Mail, ArrowRight } from "lucide-react";
import { Layout } from "../components/layout";
import { Marquee } from "../components/marquee";

export default function About() {
  return (
    <Layout>
      <section className="bg-mesh grain relative pt-32 pb-16">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <img
              src="/brand/Favicon_sharp.png"
              alt="Vylanous Beats"
              className="w-44 h-44 object-contain animate-spin-slow shrink-0"
            />
            <div>
              <p className="font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg">
                The Story
              </p>
              <h1 className="font-display uppercase text-6xl sm:text-7xl text-chrome leading-[0.85]">
                Vylanous Beats
              </h1>
              <p className="font-body text-vb-silver/70 text-lg mt-4 max-w-xl">
                Hip-hop production built on rhythmic expression and melodious composition. Vylanous
                Beats crafts beats for independent artists who refuse to sound like everyone else —
                premium quality, street energy, and pricing that doesn't gatekeep talent.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Marquee text="PROD. VYLANOUS BEATS" />

      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16 grid md:grid-cols-3 gap-5">
        {[
          {
            n: "01",
            t: "Sound First",
            b: "Every beat is mixed for the speakers it'll actually play on — phones, cars, clubs, and streaming platforms.",
          },
          {
            n: "02",
            t: "Fair Licensing",
            b: "Five clear tiers from free demos to full exclusive ownership. You always know exactly what you're getting.",
          },
          {
            n: "03",
            t: "Built For Artists",
            b: "Affordable high-volume licensing so independent artists can release more, faster, without going broke.",
          },
        ].map((c) => (
          <div key={c.n} className="rounded-2xl border border-white/[0.06] bg-vb-ink p-6">
            <span className="font-display text-5xl text-purple-glow">{c.n}</span>
            <h3 className="font-display uppercase text-2xl mt-3">{c.t}</h3>
            <p className="font-body text-vb-muted mt-2">{c.b}</p>
          </div>
        ))}
      </section>

      {/* Contact */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-20">
        <div className="rounded-2xl border border-vb-purple/30 bg-vb-purple/[0.06] p-8 sm:p-12 text-center glow-purple">
          <h2 className="font-display uppercase text-4xl sm:text-5xl text-chrome">Let's Work</h2>
          <p className="font-body text-vb-silver/70 max-w-lg mx-auto mt-3">
            Custom beats, bulk deals, or just want to connect? Reach out — every serious inquiry
            gets a reply.
          </p>
          <a
            href="mailto:vylanousbeats@gmail.com"
            className="inline-flex items-center gap-2 mt-6 font-sub uppercase tracking-widest text-lg px-7 py-3.5 rounded-xl bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors"
          >
            <Mail size={18} /> vylanousbeats@gmail.com
          </a>
        </div>

        <div className="text-center mt-10">
          <Link
            to="/beats"
            className="inline-flex items-center gap-2 font-sub uppercase tracking-widest text-lg text-vb-purple-bright hover:underline"
          >
            Browse the catalog <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
