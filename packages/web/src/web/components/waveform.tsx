interface WaveformProps {
  active?: boolean;
  bars?: number;
  className?: string;
  progress?: number; // 0..1 fill
}

// Deterministic pseudo-random heights so SSR/hydration is stable
function heights(n: number): number[] {
  const out: number[] = [];
  let seed = 7;
  for (let i = 0; i < n; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const r = seed / 233280;
    out.push(0.25 + r * 0.75);
  }
  return out;
}

export function Waveform({ active = false, bars = 48, className = "", progress = 0 }: WaveformProps) {
  const hs = heights(bars);
  return (
    <div className={`flex items-center gap-[2px] h-full w-full ${className}`}>
      {hs.map((h, i) => {
        const filled = i / bars <= progress;
        return (
          <span
            key={i}
            className={`flex-1 rounded-full ${active ? "wave-bar" : ""}`}
            style={{
              height: `${h * 100}%`,
              minWidth: 2,
              background: filled
                ? "linear-gradient(180deg,#a24df5,#7c2fcb)"
                : "rgba(201,204,214,0.22)",
              animationDelay: active ? `${(i % 8) * 0.08}s` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
