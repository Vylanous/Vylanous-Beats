import { Link } from "wouter";
import { Check, ArrowRight } from "lucide-react";
import { Layout } from "../components/layout";
import { Marquee } from "../components/marquee";
import { LICENSE_TIERS, formatCad } from "../../shared/licenses";

const COMPARE_ROWS: { label: string; values: (string | boolean)[] }[] = [
  {
    label: "File Format",
    values: ["Tagged MP3", "Untagged MP3", "WAV + MP3", "WAV+MP3+Stems", "WAV+MP3+Stems"],
  },
  { label: "Streams", values: ["—", "10,000", "50,000", "Unlimited", "Unlimited"] },
  { label: "Sold Copies", values: ["—", "2,000", "10,000", "Unlimited", "Unlimited"] },
  { label: "Music Videos", values: ["—", "1", "1", "Unlimited", "Unlimited"] },
  { label: "Monetization", values: [false, true, true, true, true] },
  { label: "Exclusive Ownership", values: [false, false, false, false, true] },
  { label: "Credit Required", values: [true, true, true, true, true] },
];

export default function Licensing() {
  return (
    <Layout>
      <section className="bg-mesh grain relative pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 text-center">
          <p className="font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg">
            Pick Your Rights
          </p>
          <h1 className="font-display uppercase text-6xl sm:text-8xl text-chrome leading-none">
            Licensing
          </h1>
          <p className="font-body text-vb-silver/60 max-w-2xl mx-auto mt-4 text-lg">
            From a free demo license to full exclusive ownership. Transparent terms, no hidden fees.
            All non-exclusive licenses are non-transferable and require crediting{" "}
            <span className="text-vb-silver-bright">"Prod. Vylanous Beats."</span>
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {LICENSE_TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative rounded-2xl p-6 border flex flex-col ${
                t.highlight
                  ? "border-vb-purple bg-vb-purple/10 glow-purple lg:scale-[1.04]"
                  : "border-white/[0.06] bg-vb-ink"
              }`}
            >
              {t.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-sub uppercase text-xs tracking-wider px-3 py-1 rounded-full bg-vb-purple text-white">
                  {t.badge}
                </span>
              )}
              <h3 className="font-display uppercase text-2xl leading-none">{t.name}</h3>
              <p className="font-body text-sm text-vb-muted mt-1 min-h-10">{t.blurb}</p>
              <p className="font-display text-4xl text-chrome mt-3">{formatCad(t.priceCents)}</p>
              <p className="font-sub uppercase text-xs tracking-wider text-vb-muted">
                {t.priceCents > 0 ? "CAD · one-time" : "no cost"}
              </p>
              <ul className="space-y-2 mt-5 flex-1">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 font-body text-sm text-vb-silver/80"
                  >
                    <Check size={15} className="text-vb-purple-bright mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/beats"
                className={`mt-6 text-center font-sub uppercase tracking-wider py-3 rounded-xl transition-colors ${
                  t.highlight
                    ? "bg-vb-purple text-white hover:bg-vb-purple-bright"
                    : "border border-white/15 hover:border-vb-purple/60"
                }`}
              >
                Browse Beats
              </Link>
            </div>
          ))}
        </div>
      </section>

      <Marquee text="LEASE OR OWN" />

      {/* Comparison table */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="font-display uppercase text-4xl sm:text-5xl text-chrome text-center mb-10">
          Compare Licenses
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-vb-ink">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="p-4 font-sub uppercase tracking-wider text-vb-muted">Feature</th>
                {LICENSE_TIERS.map((t) => (
                  <th key={t.id} className="p-4 font-display uppercase text-xl text-center">
                    {t.name.replace(" License", "").replace(" Lease", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, ri) => (
                <tr key={ri} className="border-b border-white/[0.04] last:border-0">
                  <td className="p-4 font-body text-vb-silver">{row.label}</td>
                  {row.values.map((v, vi) => (
                    <td key={vi} className="p-4 text-center font-body">
                      {typeof v === "boolean" ? (
                        v ? (
                          <Check size={18} className="inline text-vb-purple-bright" />
                        ) : (
                          <span className="text-vb-muted">—</span>
                        )
                      ) : (
                        <span className="text-vb-silver/90">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-4 font-body text-vb-silver">Price</td>
                {LICENSE_TIERS.map((t) => (
                  <td key={t.id} className="p-4 text-center font-display text-xl text-chrome">
                    {formatCad(t.priceCents)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/[0.06] bg-vb-ink p-6">
            <h3 className="font-display uppercase text-2xl mb-2">Non-Exclusive vs Exclusive</h3>
            <p className="font-body text-vb-muted">
              Lease licenses (MP3, WAV, Unlimited) are non-exclusive — the same beat may be licensed
              to other artists. An Exclusive License transfers full ownership and the beat is
              permanently removed from the store.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-vb-ink p-6">
            <h3 className="font-display uppercase text-2xl mb-2">Need a custom deal?</h3>
            <p className="font-body text-vb-muted">
              Bulk licensing, custom beats, or split agreements — reach out at{" "}
              <span className="text-vb-purple-bright">support@vylanous.com</span> and we'll sort it.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 mt-4 font-sub uppercase tracking-wider text-vb-purple-bright hover:underline"
            >
              Get in touch <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
