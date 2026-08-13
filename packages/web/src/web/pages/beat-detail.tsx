import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, ShoppingCart, Check, ArrowLeft } from "lucide-react";
import { Layout } from "../components/layout";
import { Waveform } from "../components/waveform";
import { usePlayer } from "../lib/player";
import { useCart } from "../lib/cart";
import { api } from "../lib/api";
import { LICENSE_TIERS, formatCad, type LicenseTierId } from "../../shared/licenses";
import type { Beat } from "../../api/database/schema";

export default function BeatDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["beat", slug],
    queryFn: async () => (await api.beats[":slug"].$get({ param: { slug } })).json(),
  });
  const beat = (data && "beat" in data ? data.beat : null) as Beat | null;

  const { current, isPlaying, playBeat, progress, seek } = usePlayer();
  const { add, has } = useCart();
  const [tier, setTier] = useState<LicenseTierId>("wav");

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-12 bg-white/5 rounded w-2/3 animate-pulse" />
              <div className="h-64 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!beat) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-5 pt-40 pb-20 text-center">
          <h1 className="font-display uppercase text-5xl text-chrome">Beat Not Found</h1>
          <Link
            to="/beats"
            className="inline-block mt-6 font-sub uppercase tracking-wider text-vb-purple-bright"
          >
            ← Back to catalog
          </Link>
        </div>
      </Layout>
    );
  }

  const beatPlaying = current?.id === beat.id && isPlaying;
  const selected = LICENSE_TIERS.find((t) => t.id === tier)!;
  const tags = beat.tags.split(",").filter(Boolean);

  return (
    <Layout>
      <section className="bg-mesh grain relative pt-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
          <Link
            to="/beats"
            className="inline-flex items-center gap-2 font-sub uppercase tracking-wider text-vb-muted hover:text-vb-purple-bright mb-8"
          >
            <ArrowLeft size={16} /> All Beats
          </Link>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Artwork + player */}
            <div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 glow-purple">
                <img
                  src={beat.artworkUrl}
                  alt={beat.title}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-vb-black/80 to-transparent" />
                <button
                  onClick={() =>
                    playBeat({
                      id: beat.id,
                      title: beat.title,
                      artworkUrl: beat.artworkUrl,
                      audioUrl: beat.audioUrl,
                      bpm: beat.bpm,
                      musicalKey: beat.musicalKey,
                    })
                  }
                  className="absolute inset-0 grid place-items-center"
                >
                  <span className="grid place-items-center w-20 h-20 rounded-full bg-vb-purple text-white glow-purple-strong hover:bg-vb-purple-bright transition-colors">
                    {beatPlaying ? (
                      <Pause size={30} fill="currentColor" />
                    ) : (
                      <Play size={30} fill="currentColor" className="ml-1" />
                    )}
                  </span>
                </button>
              </div>
              <button
                type="button"
                disabled={current?.id !== beat.id}
                aria-label="Seek beat preview; use left and right arrow keys for small adjustments"
                className="h-14 mt-4 w-full cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-vb-purple-bright rounded"
                onClick={(e) => {
                  if (e.detail === 0 || current?.id !== beat.id) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  seek((e.clientX - rect.left) / rect.width);
                }}
                onKeyDown={(e) => {
                  if (current?.id !== beat.id) return;
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    seek(Math.max(0, progress - 0.05));
                  }
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    seek(Math.min(1, progress + 0.05));
                  }
                }}
              >
                <Waveform
                  active={!!beatPlaying}
                  bars={72}
                  progress={current?.id === beat.id ? progress : 0}
                />
              </button>
            </div>

            {/* Info + license */}
            <div>
              <p className="font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg">
                {beat.genre} · {beat.mood}
              </p>
              <h1 className="font-display uppercase text-6xl sm:text-7xl text-chrome leading-[0.85] mt-1">
                {beat.title}
              </h1>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="font-sub uppercase text-sm px-3 py-1 rounded-lg bg-vb-ink border border-white/10">
                  {beat.bpm} BPM
                </span>
                <span className="font-sub uppercase text-sm px-3 py-1 rounded-lg bg-vb-ink border border-white/10">
                  Key {beat.musicalKey}
                </span>
                {tags.map((t) => (
                  <span
                    key={t}
                    className="font-body text-sm px-3 py-1 rounded-lg bg-vb-ink border border-white/10 text-vb-muted lowercase"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* License selector */}
              <div className="mt-8">
                <p className="font-sub uppercase tracking-widest text-vb-silver mb-3">
                  Choose License
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {LICENSE_TIERS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTier(t.id)}
                      className={`text-left rounded-xl p-4 border transition-all ${
                        tier === t.id
                          ? "border-vb-purple bg-vb-purple/10 glow-purple"
                          : "border-white/10 bg-vb-ink hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display uppercase text-xl">{t.name}</span>
                        <span className="font-display text-xl text-chrome">
                          {formatCad(t.priceCents)}
                        </span>
                      </div>
                      <span className="font-body text-sm text-vb-muted">{t.fileFormat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected tier features */}
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-6">
                {selected.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 font-body text-vb-silver/80 text-sm"
                  >
                    <Check size={15} className="text-vb-purple-bright mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() =>
                  add({
                    beatId: beat.id,
                    beatTitle: beat.title,
                    artworkUrl: beat.artworkUrl,
                    tier: selected.id,
                    tierName: selected.name,
                    priceCents: selected.priceCents,
                  })
                }
                disabled={has(beat.id, tier)}
                className="w-full mt-8 inline-flex items-center justify-center gap-2 font-sub uppercase tracking-widest text-xl py-4 rounded-xl bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors glow-purple disabled:opacity-60"
              >
                {has(beat.id, tier) ? (
                  <>
                    <Check size={20} /> In Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} /> Add {selected.name} —{" "}
                    {formatCad(selected.priceCents)}
                  </>
                )}
              </button>
              <Link
                to="/licensing"
                className="block text-center mt-4 font-sub uppercase tracking-wider text-vb-muted hover:text-vb-purple-bright"
              >
                Read full license terms →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
