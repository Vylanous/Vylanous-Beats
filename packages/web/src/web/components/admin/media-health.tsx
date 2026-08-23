import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileWarning,
  HeartPulse,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { adminApi, type MediaHealthReport, type MediaHealthStatus } from "../../lib/admin";

const STATUS_META: Record<MediaHealthStatus, { label: string; tone: string }> = {
  healthy: {
    label: "Healthy",
    tone: "text-emerald-300 border-emerald-400/25 bg-emerald-400/[0.08]",
  },
  broken: {
    label: "Broken",
    tone: "text-red-300 border-red-400/25 bg-red-400/[0.08]",
  },
  missing: {
    label: "Missing",
    tone: "text-amber-200 border-amber-300/25 bg-amber-300/[0.08]",
  },
  external: {
    label: "External",
    tone: "text-cyan-200 border-cyan-300/25 bg-cyan-300/[0.08]",
  },
  public: {
    label: "Public asset",
    tone: "text-vb-purple-bright border-vb-purple/25 bg-vb-purple/[0.08]",
  },
  unavailable: {
    label: "Storage unavailable",
    tone: "text-orange-200 border-orange-300/25 bg-orange-300/[0.08]",
  },
};

const STATUS_ORDER: MediaHealthStatus[] = [
  "broken",
  "missing",
  "healthy",
  "external",
  "public",
  "unavailable",
];

export default function MediaHealthPanel() {
  const [report, setReport] = useState<MediaHealthReport | null>(null);
  const [status, setStatus] = useState<MediaHealthStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runCheck = async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await adminApi.mediaHealth());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Media health check failed.");
    } finally {
      setLoading(false);
    }
  };

  const items = useMemo(
    () => report?.items.filter((item) => status === "all" || item.status === status) || [],
    [report, status],
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse size={22} className="text-vb-purple-bright" />
            <h1 className="font-display text-3xl uppercase tracking-wide text-chrome">
              Media Health Check
            </h1>
          </div>
          <p className="mt-2 max-w-2xl font-body text-sm text-vb-silver/55">
            Scan Builder media, brand assets, SEO images, beat artwork, audio, and downloadable
            files for missing or broken storage references.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runCheck()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-vb-purple px-4 py-2.5 font-sub text-xs uppercase tracking-wide text-white hover:bg-vb-purple-bright disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {loading ? "Scanning" : report ? "Run again" : "Run health check"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/25 bg-red-400/[0.08] px-3 py-2 font-body text-sm text-red-200">
          {error}
        </p>
      )}

      {!report ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
          <FileWarning size={28} className="mx-auto text-vb-silver/45" />
          <h2 className="mt-3 font-sub text-lg uppercase tracking-wide">No scan yet</h2>
          <p className="mt-1 font-body text-sm text-vb-silver/50">
            Run a check to inspect every saved media reference.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STATUS_ORDER.map((key) => {
              const meta = STATUS_META[key];
              const count = report.summary[key] || 0;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setStatus(status === key ? "all" : key)}
                  className={`rounded-xl border p-4 text-left transition ${meta.tone} ${status === key ? "ring-2 ring-current/40" : ""}`}
                >
                  <span className="flex items-center justify-between gap-2 font-sub text-xs uppercase tracking-[0.15em]">
                    {meta.label}
                    {key === "healthy" ? (
                      <CheckCircle2 size={15} />
                    ) : key === "broken" || key === "missing" ? (
                      <TriangleAlert size={15} />
                    ) : null}
                  </span>
                  <span className="mt-2 block font-display text-3xl">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
              <div>
                <h2 className="font-sub text-lg uppercase tracking-wide">Media references</h2>
                <p className="font-body text-xs text-vb-silver/45">
                  {items.length} shown · checked {new Date(report.checkedAt).toLocaleString()}
                </p>
              </div>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as MediaHealthStatus | "all")}
                className="rounded-lg border border-white/10 bg-vb-black px-3 py-2 font-body text-xs text-vb-silver-bright outline-none"
                aria-label="Filter media health status"
              >
                <option value="all">All statuses</option>
                {STATUS_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {STATUS_META[key].label}
                  </option>
                ))}
              </select>
            </div>
            {items.length ? (
              <div className="divide-y divide-white/[0.06]">
                {items.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <div
                      key={item.id}
                      className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1.6fr)] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-body text-sm text-vb-silver-bright">
                          {item.source}
                        </p>
                        <p className="truncate font-mono text-[10px] text-vb-silver/40">
                          {item.kind} · {item.reference}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border px-2 py-1 font-sub text-[10px] uppercase tracking-wide ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                      <p className="font-body text-xs text-vb-silver/50">
                        {item.detail}
                        {item.normalizedKey ? ` Key: ${item.normalizedKey}` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center font-body text-sm text-vb-silver/50">
                No media references match this filter.
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
