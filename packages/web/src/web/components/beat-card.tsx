import { useState } from "react";
import { Link } from "wouter";
import { Play, Pause, ShoppingCart, Check } from "lucide-react";
import { usePlayer } from "../lib/player";
import { useCart } from "../lib/cart-store";
import { Waveform } from "./waveform";
import { LICENSE_TIERS, formatCad, type LicenseTierId } from "../../shared/licenses";
import type { Beat } from "../../api/database/schema";

export function BeatCard({ beat }: { beat: Beat }) {
  const { current, isPlaying, playBeat, progress } = usePlayer();
  const { add, has } = useCart();
  const [tier, setTier] = useState<LicenseTierId>("wav");
  const [artworkFailed, setArtworkFailed] = useState(false);
  const isCurrent = current?.id === beat.id;
  const playing = isCurrent && isPlaying;

  const selectedTier = LICENSE_TIERS.find((t) => t.id === tier)!;
  const tags = beat.tags.split(",").filter(Boolean).slice(0, 3);

  return (
    <div className="group relative bg-vb-ink border border-white/[0.06] rounded-xl overflow-hidden transition-all duration-300 hover:border-vb-purple/50 hover:-translate-y-1 hover:glow-purple">
      {/* Artwork */}
      <div className="relative aspect-square overflow-hidden">
        {artworkFailed || !beat.artworkUrl ? (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(162,77,245,.7),transparent_42%),linear-gradient(135deg,#1b1b22,#0a0a0c)] px-6 text-center">
            <span className="font-display text-3xl uppercase tracking-wide text-vb-silver-bright/80">
              {beat.title}
            </span>
          </div>
        ) : (
          <img
            src={beat.artworkUrl}
            alt={`${beat.title} artwork`}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
            onError={() => setArtworkFailed(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-vb-black via-transparent to-transparent" />
        {/* Play button */}
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
          className="absolute inset-0 flex items-center justify-center"
          aria-label={playing ? "Pause" : "Play"}
        >
          <span
            className={`grid place-items-center w-14 h-14 rounded-full bg-vb-purple text-white transition-all duration-300 ${
              playing
                ? "opacity-100 scale-100"
                : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
            } glow-purple-strong`}
          >
            {playing ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" className="ml-0.5" />
            )}
          </span>
        </button>
        {/* BPM / key badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="font-sub text-xs uppercase px-2 py-0.5 bg-black/60 backdrop-blur rounded text-vb-silver border border-white/10">
            {beat.bpm} BPM
          </span>
          <span className="font-sub text-xs uppercase px-2 py-0.5 bg-black/60 backdrop-blur rounded text-vb-silver border border-white/10">
            {beat.musicalKey}
          </span>
        </div>
        {/* Waveform strip when current */}
        {isCurrent && (
          <div className="absolute bottom-0 left-0 right-0 h-10 px-3 pb-2">
            <Waveform active={playing} bars={40} progress={progress} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/beats/${beat.slug}`} className="min-w-0">
            <h3 className="font-display text-xl uppercase leading-none text-vb-silver-bright truncate hover:text-purple-glow transition-colors">
              {beat.title}
            </h3>
          </Link>
          <span className="font-sub text-vb-purple-bright text-sm uppercase shrink-0 mt-1">
            {beat.genre}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((t) => (
            <span key={t} className="text-[11px] text-vb-muted font-body lowercase">
              #{t}
            </span>
          ))}
        </div>

        {/* License selector + add */}
        <div className="flex items-center gap-2 mt-4">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as LicenseTierId)}
            className="flex-1 min-w-0 bg-vb-black border border-white/10 rounded-lg px-3 py-2 text-sm font-body text-vb-silver focus:border-vb-purple outline-none cursor-pointer"
          >
            {LICENSE_TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {formatCad(t.priceCents)}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              add({
                beatId: beat.id,
                beatTitle: beat.title,
                artworkUrl: beat.artworkUrl,
                tier: selectedTier.id,
                tierName: selectedTier.name,
                priceCents: selectedTier.priceCents,
              })
            }
            disabled={has(beat.id, tier)}
            className="shrink-0 grid place-items-center w-10 h-10 rounded-lg bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors disabled:opacity-50 disabled:bg-vb-ink-2"
            aria-label="Add to cart"
          >
            {has(beat.id, tier) ? <Check size={18} /> : <ShoppingCart size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
