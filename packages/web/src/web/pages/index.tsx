import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Play, Pause, ArrowRight, Music4, ShieldCheck, Zap } from "lucide-react";
import { Layout } from "../components/layout";
import { Marquee } from "../components/marquee";
import { BeatCard } from "../components/beat-card";
import { Waveform } from "../components/waveform";
import { usePlayer } from "../lib/player";
import { api } from "../lib/api";
import { LICENSE_TIERS, formatCad } from "../../shared/licenses";
import type { Beat } from "../../api/database/schema";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Index() {
  const { data } = useQuery({
    queryKey: ["beats", "featured"],
    queryFn: async () => (await api.beats.featured.$get()).json(),
  });
  const beats = (data && "beats" in data ? data.beats : []) as Beat[];
  const hero = beats[0];
  const { current, isPlaying, playBeat, progress } = usePlayer();
  const heroPlaying = hero && current?.id === hero.id && isPlaying;

  return (
    <Layout>
      {/* HERO */}
      <section className="relative bg-mesh grain overflow-hidden">
        <div className="absolute inset-0 grain" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-16 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.p
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg mb-4"
            >
              Premium Hip-Hop Beats
            </motion.p>
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="font-display uppercase leading-[0.85] text-6xl sm:text-7xl md:text-8xl"
            >
              <span className="text-chrome">Beats That</span>
              <br />
              <span className="text-purple-glow">Hit Different.</span>
            </motion.h1>
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="font-body text-vb-silver/70 text-lg max-w-xl mt-6"
            >
              Rhythmic expression, melodious compositions, and street-ready energy. Lease or own —
              affordable licensing for independent artists who want to stand out.
            </motion.p>
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-4 mt-8"
            >
              <Link
                to="/beats"
                className="group inline-flex items-center gap-2 font-sub uppercase tracking-widest text-lg px-7 py-3.5 rounded-xl bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors glow-purple"
              >
                Browse Beats
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/licensing"
                className="inline-flex items-center font-sub uppercase tracking-widest text-lg px-7 py-3.5 rounded-xl border border-white/15 text-vb-silver-bright hover:border-vb-purple/60 transition-colors"
              >
                View Licensing
              </Link>
            </motion.div>
          </div>

          {/* Hero featured beat player */}
          {hero && (
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="lg:col-span-5"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-vb-ink glow-purple">
                <div className="relative aspect-square">
                  <img src={hero.artworkUrl} alt={hero.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-vb-black via-vb-black/20 to-transparent" />
                  <button
                    onClick={() =>
                      playBeat({
                        id: hero.id,
                        title: hero.title,
                        artworkUrl: hero.artworkUrl,
                        audioUrl: hero.audioUrl,
                        bpm: hero.bpm,
                        musicalKey: hero.musicalKey,
                      })
                    }
                    className="absolute top-4 right-4 grid place-items-center w-14 h-14 rounded-full bg-vb-purple text-white glow-purple-strong hover:bg-vb-purple-bright transition-colors"
                  >
                    {heroPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="font-sub uppercase tracking-widest text-vb-purple-bright">Featured Drop</p>
                    <h3 className="font-display uppercase text-4xl leading-none mt-1">{hero.title}</h3>
                    <p className="font-sub uppercase text-sm text-vb-silver tracking-wider mt-1">
                      {hero.bpm} BPM · {hero.musicalKey} · {hero.genre}
                    </p>
                    <div className="h-10 mt-3">
                      <Waveform active={!!heroPlaying} bars={56} progress={current?.id === hero.id ? progress : 0} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
                  <span className="font-body text-vb-muted">From</span>
                  <span className="font-display text-2xl text-chrome">{formatCad(hero.priceFrom)} CAD</span>
                  <Link
                    to={`/beats/${hero.slug}`}
                    className="font-sub uppercase tracking-wider text-vb-purple-bright hover:underline"
                  >
                    License →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Marquee text="NEW DROPS" />

      {/* FEATURED BEATS */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg">Hand-picked</p>
            <h2 className="font-display uppercase text-5xl sm:text-6xl text-chrome leading-none">Featured Beats</h2>
          </div>
          <Link
            to="/beats"
            className="hidden sm:inline-flex items-center gap-2 font-sub uppercase tracking-wider text-vb-silver hover:text-vb-purple-bright"
          >
            All beats <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {beats.slice(0, 6).map((b) => (
            <BeatCard key={b.id} beat={b} />
          ))}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-8">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Zap, title: "Instant Delivery", body: "Pay and download immediately. Files hit your inbox too." },
            { icon: ShieldCheck, title: "Clear Licensing", body: "Five tiers from free to full exclusive ownership. No fine-print games." },
            { icon: Music4, title: "Studio Quality", body: "WAV, MP3, and trackout stems mixed for radio and streaming." },
          ].map((f, i) => (
            <div key={i} className="bg-vb-ink border border-white/[0.06] rounded-xl p-6">
              <div className="grid place-items-center w-12 h-12 rounded-lg bg-vb-purple/15 text-vb-purple-bright mb-4">
                <f.icon size={22} />
              </div>
              <h3 className="font-display uppercase text-2xl">{f.title}</h3>
              <p className="font-body text-vb-muted mt-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LICENSE PREVIEW */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="text-center mb-12">
          <p className="font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg">Pick Your Rights</p>
          <h2 className="font-display uppercase text-5xl sm:text-6xl text-chrome leading-none">Licensing</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {LICENSE_TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative rounded-xl p-5 border flex flex-col ${
                t.highlight
                  ? "border-vb-purple bg-vb-purple/10 glow-purple"
                  : "border-white/[0.06] bg-vb-ink"
              }`}
            >
              {t.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 font-sub uppercase text-xs tracking-wider px-3 py-0.5 rounded-full bg-vb-purple text-white">
                  {t.badge}
                </span>
              )}
              <h3 className="font-display uppercase text-2xl leading-none mt-1">{t.name}</h3>
              <p className="font-display text-3xl text-chrome mt-2">{formatCad(t.priceCents)}</p>
              <p className="font-body text-sm text-vb-muted mt-1">{t.fileFormat}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/licensing"
            className="inline-flex items-center gap-2 font-sub uppercase tracking-widest text-lg px-7 py-3.5 rounded-xl border border-white/15 hover:border-vb-purple/60 transition-colors"
          >
            Compare All Licenses <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Marquee text="VYLANOUS BEATS" reverse />
    </Layout>
  );
}
