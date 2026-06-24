export function Marquee({
  text = "NEW DROPS",
  reverse = false,
}: {
  text?: string;
  reverse?: boolean;
}) {
  const items = Array.from({ length: 8 }).map((_, i) => i);
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-vb-ink/40 py-4 select-none">
      <div className={`flex whitespace-nowrap ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}>
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0">
            {items.map((i) => (
              <span key={i} className="flex items-center font-display uppercase text-3xl sm:text-4xl mx-6">
                <span className={i % 2 === 0 ? "text-vb-silver-bright" : "text-purple-glow"}>{text}</span>
                <span className="text-vb-purple mx-6">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
