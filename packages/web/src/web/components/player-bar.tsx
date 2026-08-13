import { Play, Pause, X } from "lucide-react";
import { usePlayer } from "../lib/player";
import { Waveform } from "./waveform";

export function PlayerBar() {
  const { current, isPlaying, toggle, progress, seek, stop } = usePlayer();
  if (!current) return null;

  const seekFromPointer = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    seek((event.clientX - rect.left) / rect.width);
  };

  const seekFromKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      seek(Math.max(0, progress - 0.05));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seek(Math.min(1, progress + 0.05));
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-vb-ink/95 backdrop-blur-xl border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center gap-4">
        <img
          src={current.artworkUrl}
          alt=""
          className="w-14 h-14 rounded-lg object-cover shrink-0"
        />

        <button
          onClick={toggle}
          className="shrink-0 grid place-items-center w-12 h-12 rounded-full bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors glow-purple"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <div className="min-w-0 w-32 sm:w-44 shrink-0">
          <p className="font-display uppercase text-lg leading-none truncate">{current.title}</p>
          <p className="font-sub text-xs uppercase tracking-wider text-vb-muted mt-1">
            {current.bpm} BPM · {current.musicalKey}
          </p>
        </div>

        {/* Seek / waveform */}
        <button
          type="button"
          aria-label="Seek audio; use left and right arrow keys for small adjustments"
          className="relative flex-1 h-10 hidden sm:block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-vb-purple-bright rounded"
          onClick={seekFromPointer}
          onKeyDown={seekFromKeyboard}
        >
          <Waveform active={isPlaying} bars={64} progress={progress} />
        </button>

        {/* Mobile progress bar */}
        <button
          type="button"
          aria-label="Seek audio; use left and right arrow keys for small adjustments"
          className="flex-1 h-1.5 rounded-full bg-white/10 sm:hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-vb-purple-bright"
          onClick={seekFromPointer}
          onKeyDown={seekFromKeyboard}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-vb-purple to-vb-purple-bright"
            style={{ width: `${progress * 100}%` }}
          />
        </button>

        <button
          onClick={stop}
          className="shrink-0 grid place-items-center w-9 h-9 rounded-lg text-vb-muted hover:text-vb-silver-bright hover:bg-white/5"
          aria-label="Close player"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
