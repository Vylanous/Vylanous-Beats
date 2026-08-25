import { useCallback, useEffect, useState } from "react";
import { Archive, BarChart3, Loader2, MousePointerClick, Play, RefreshCw } from "lucide-react";
import {
  adminApi,
  type PublishedBeatAnalyticsReport,
  type PublishedBeatAnalyticsRow,
} from "../../lib/admin";

const WINDOWS: Array<{ value: 7 | 30 | 90; label: string }> = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

function MetricCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: typeof BarChart3;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-vb-ink p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-sub text-[10px] uppercase tracking-[0.16em] text-vb-silver/55">
          {label}
        </p>
        <Icon size={16} className="text-vb-purple-bright" />
      </div>
      <p className="mt-2 font-display text-3xl text-chrome">{value.toLocaleString()}</p>
    </div>
  );
}

function AnalyticsRow({ row }: { row: PublishedBeatAnalyticsRow }) {
  return (
    <tr className="border-t border-white/[0.06] align-top">
      <td className="px-4 py-3">
        <p className="font-body text-sm text-vb-silver-bright">{row.beatTitle}</p>
        <p className="mt-0.5 font-mono text-[10px] text-vb-silver/40">
          {row.beatSlug || row.beatId}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="font-body text-sm text-vb-silver">{row.pageTitle}</p>
        <p className="mt-0.5 font-mono text-[10px] text-vb-silver/40">
          {row.pagePath || row.pageId}
        </p>
        <p className="mt-1 font-body text-xs text-vb-silver/55">{row.blockTitle}</p>
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm text-vb-silver">{row.clicks}</td>
      <td className="px-4 py-3 text-right font-mono text-sm text-vb-silver">{row.plays}</td>
      <td className="px-4 py-3 text-right font-mono text-sm text-purple-glow">{row.total}</td>
      <td className="px-4 py-3 text-right font-mono text-xs text-vb-silver/50">{row.lastDay}</td>
    </tr>
  );
}

export default function PublishedBeatAnalyticsPanel() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [report, setReport] = useState<PublishedBeatAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [rollingUp, setRollingUp] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await adminApi.publishedBeatAnalytics(days));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load Published Beats analytics.",
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const rollup = async () => {
    setRollingUp(true);
    setError("");
    try {
      await adminApi.rollupPublishedBeatAnalytics();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to apply analytics retention.");
    } finally {
      setRollingUp(false);
    }
  };

  const summary = report?.summary;
  return (
    <section className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-sub text-xs uppercase tracking-[0.18em] text-vb-purple-bright">
            Published Beats
          </p>
          <h1 className="mt-1 font-display text-4xl uppercase tracking-wide text-chrome">
            Analytics
          </h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-vb-silver/60">
            See card-detail clicks and successful preview starts for each beat selected in a Page
            Builder Published Beats block. These are aggregate interactions, not unique visitors; no
            visitor or customer identifiers are stored.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void rollup()}
            disabled={rollingUp}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-sub text-xs uppercase tracking-wide text-vb-silver transition hover:border-vb-purple/50 hover:text-vb-silver-bright disabled:opacity-50"
          >
            <Archive size={14} className={rollingUp ? "animate-pulse" : ""} /> Retain 90 days
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-sub text-xs uppercase tracking-wide text-vb-silver transition hover:border-vb-purple/50 hover:text-vb-silver-bright disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Analytics reporting window">
        {WINDOWS.map((window) => (
          <button
            key={window.value}
            type="button"
            onClick={() => setDays(window.value)}
            className={`rounded-full border px-3 py-1.5 font-sub text-xs uppercase tracking-wide transition ${days === window.value ? "border-vb-purple/60 bg-vb-purple/20 text-purple-glow" : "border-white/10 text-vb-silver/60 hover:border-vb-purple/35 hover:text-vb-silver"}`}
          >
            {window.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Beat-detail clicks"
          value={summary?.clicks || 0}
          Icon={MousePointerClick}
        />
        <MetricCard label="Preview plays" value={summary?.plays || 0} Icon={Play} />
        <MetricCard label="Tracked beats" value={summary?.trackedBeats || 0} Icon={BarChart3} />
        <MetricCard label="Tracked blocks" value={summary?.trackedBlocks || 0} Icon={BarChart3} />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08] bg-vb-ink">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div>
            <h2 className="font-sub text-sm uppercase tracking-wide text-vb-silver-bright">
              Per-beat performance
            </h2>
            <p className="mt-1 font-body text-xs text-vb-silver/45">
              {report ? `From ${report.sinceDay} through today.` : "Loading report window…"}
              {" Daily interactions older than 90 days are retained as monthly totals."}
            </p>
          </div>
          {loading && <Loader2 className="animate-spin text-vb-purple-bright" size={18} />}
        </div>
        {error ? (
          <p className="p-5 font-body text-sm text-red-300">{error}</p>
        ) : !loading && report?.rows.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="mx-auto text-vb-silver/30" size={28} />
            <p className="mt-3 font-body text-sm text-vb-silver/60">
              No Published Beats interactions have been recorded in this window yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left">
              <thead className="bg-white/[0.02] font-sub text-[10px] uppercase tracking-[0.14em] text-vb-silver/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Beat</th>
                  <th className="px-4 py-3 font-medium">Page / block</th>
                  <th className="px-4 py-3 text-right font-medium">Clicks</th>
                  <th className="px-4 py-3 text-right font-medium">Plays</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Latest day</th>
                </tr>
              </thead>
              <tbody>
                {report?.rows.map((row) => (
                  <AnalyticsRow key={`${row.pageId}:${row.blockId}:${row.beatId}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
