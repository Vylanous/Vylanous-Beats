import { useEffect, useState } from "react";
import { Link, useSearchParams } from "wouter";
import { CheckCircle2, Download, Clock, Mail } from "lucide-react";
import { Layout } from "../components/layout";
import { formatCad } from "../../shared/licenses";

interface OrderItem {
  beatTitle: string;
  licenseName: string;
  licenseTier: string;
  priceCents: number;
  downloadUrl: string | null;
}

export default function SuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get("order") || "";
  const token = params.get("token") || "";

  const [items, setItems] = useState<OrderItem[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!orderId || !token) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const run = async () => {
      // confirm first (verifies stripe payment if needed)
      await fetch(`/api/orders/${orderId}/confirm?token=${token}`, { method: "POST" }).catch(() => {});
      const res = await fetch(`/api/orders/${orderId}?token=${token}`);
      if (!res.ok) {
        if (!cancelled) setLoading(false);
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      setItems(data.items || []);
      setUnlocked(data.unlocked);
      setEmail(data.order?.email || "");
      setTotal(data.order?.totalCents || 0);
      setLoading(false);
      // if not yet paid, poll a few times (stripe webhook delay)
      if (!data.unlocked && polls < 5) {
        setTimeout(() => setPolls((p) => p + 1), 2500);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [orderId, token, polls]);

  if (!orderId || !token) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-5 pt-40 pb-24 text-center">
          <h1 className="font-display uppercase text-5xl text-chrome">No Order Found</h1>
          <Link to="/beats" className="inline-block mt-6 font-sub uppercase tracking-wider text-vb-purple-bright">
            ← Back to beats
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-mesh grain relative pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <div className="text-center">
            <div className="inline-grid place-items-center w-20 h-20 rounded-full bg-vb-purple/15 text-vb-purple-bright mb-5 glow-purple">
              <CheckCircle2 size={42} />
            </div>
            <p className="font-sub uppercase tracking-[0.3em] text-vb-purple-bright text-lg">Order Confirmed</p>
            <h1 className="font-display uppercase text-6xl sm:text-7xl text-chrome leading-none">You're In.</h1>
            {email && (
              <p className="font-body text-vb-silver/70 mt-4 flex items-center justify-center gap-2">
                <Mail size={16} className="text-vb-purple-bright" /> Download links also sent to {email}
              </p>
            )}
          </div>

          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-vb-ink p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display uppercase text-2xl">Your Files</h2>
              <span className="font-display text-xl text-chrome">{formatCad(total)} CAD</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !unlocked ? (
              <div className="text-center py-8">
                <Clock size={32} className="mx-auto text-vb-purple-bright animate-pulse" />
                <p className="font-body text-vb-silver mt-3">Confirming your payment…</p>
                <p className="font-body text-sm text-vb-muted mt-1">
                  This usually takes a few seconds. Your download links unlock the moment it clears.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((it, i) => (
                  <li key={i} className="flex items-center gap-4 bg-vb-black rounded-xl p-4 border border-white/[0.06]">
                    <div className="flex-1 min-w-0">
                      <p className="font-display uppercase text-xl leading-none truncate">{it.beatTitle}</p>
                      <p className="font-sub uppercase text-xs tracking-wider text-vb-purple-bright mt-1">{it.licenseName}</p>
                    </div>
                    {it.downloadUrl ? (
                      <a
                        href={it.downloadUrl}
                        download
                        className="inline-flex items-center gap-2 font-sub uppercase tracking-wider px-4 py-2.5 rounded-lg bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors"
                      >
                        <Download size={16} /> Download
                      </a>
                    ) : (
                      <span className="font-body text-sm text-vb-muted">Locked</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="font-body text-vb-muted text-sm">
              Save this page — your link is private to your order. Questions? vylanousbeats@gmail.com
            </p>
            <Link
              to="/beats"
              className="inline-block mt-5 font-sub uppercase tracking-widest text-lg px-7 py-3 rounded-xl border border-white/15 hover:border-vb-purple/60"
            >
              Keep Browsing
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
