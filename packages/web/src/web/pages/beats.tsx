import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { Layout } from "../components/layout";
import { BeatCard } from "../components/beat-card";
import { api } from "../lib/api";
import type { Beat } from "../../api/database/schema";

export default function BeatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["beats", "all"],
    queryFn: async () => (await api.beats.$get()).json(),
  });
  const beats = (data && "beats" in data ? data.beats : []) as Beat[];

  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState("featured");

  const genres = useMemo(() => ["All", ...Array.from(new Set(beats.map((b) => b.genre)))], [beats]);

  const filtered = useMemo(() => {
    let list = beats.filter((b) => {
      const matchQ =
        !q ||
        b.title.toLowerCase().includes(q.toLowerCase()) ||
        b.tags.toLowerCase().includes(q.toLowerCase()) ||
        b.mood.toLowerCase().includes(q.toLowerCase());
      const matchG = genre === "All" || b.genre === genre;
      return matchQ && matchG;
    });
    if (sort === "bpm") list = [...list].sort((a, b) => a.bpm - b.bpm);
    if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [beats, q, genre, sort]);

  return (
    <Layout>
      <section className="bg-mesh grain relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-12">
          <p className="font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg">The Catalog</p>
          <h1 className="font-display uppercase text-6xl sm:text-7xl text-chrome leading-none">All Beats</h1>
          <p className="font-body text-vb-silver/60 mt-3 max-w-lg">
            Browse the full library. Hit play, pick a license, drop it in your cart.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vb-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search beats, moods, tags…"
              className="w-full bg-vb-ink border border-white/10 rounded-xl pl-11 pr-4 py-3 font-body focus:border-vb-purple outline-none"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-vb-ink border border-white/10 rounded-xl px-4 py-3 font-body text-vb-silver focus:border-vb-purple outline-none cursor-pointer"
            >
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <div className="relative">
              <SlidersHorizontal size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vb-muted pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-vb-ink border border-white/10 rounded-xl pl-10 pr-4 py-3 font-body text-vb-silver focus:border-vb-purple outline-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="bpm">BPM ↑</option>
                <option value="az">A–Z</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-vb-ink border border-white/[0.06] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-white/5 rounded w-2/3" />
                  <div className="h-10 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-vb-muted font-body">No beats match your search.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b) => (
              <BeatCard key={b.id} beat={b} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
