import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Lock, ArrowRight, ShoppingBag } from "lucide-react";
import { Layout } from "../components/layout";
import { useCart } from "../lib/cart";
import { formatCad } from "../../shared/licenses";

export default function CartPage() {
  const { items, remove, totalCents, clear } = useCart();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          items: items.map((i) => ({ beatId: i.beatId, tier: i.tier })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "stripe_not_configured") {
          setError(
            "Payments aren't switched on yet. Add your Stripe key to start taking real orders. (Free licenses still work.)",
          );
        } else {
          setError(data.message || data.error || "Checkout failed. Try again.");
        }
        setLoading(false);
        return;
      }
      if (data.mode === "free") {
        clear();
        navigate(data.url);
        return;
      }
      if (data.url) {
        clear();
        window.location.href = data.url; // Stripe Checkout
        return;
      }
      setError("Unexpected response.");
      setLoading(false);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-5 pt-40 pb-24 text-center">
          <ShoppingBag size={48} className="mx-auto text-vb-muted opacity-40" />
          <h1 className="font-display uppercase text-5xl text-chrome mt-4">Cart Empty</h1>
          <p className="font-body text-vb-muted mt-2">Go find something that knocks.</p>
          <Link
            to="/beats"
            className="inline-flex items-center gap-2 mt-8 font-sub uppercase tracking-widest text-lg px-7 py-3.5 rounded-xl bg-vb-purple text-white hover:bg-vb-purple-bright glow-purple"
          >
            Browse Beats <ArrowRight size={18} />
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <h1 className="font-display uppercase text-6xl sm:text-7xl text-chrome leading-none mb-10">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Items */}
          <div className="lg:col-span-3 space-y-3">
            {items.map((it) => (
              <div
                key={it.beatId + it.tier}
                className="flex items-center gap-4 bg-vb-ink border border-white/[0.06] rounded-xl p-4"
              >
                <img src={it.artworkUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-display uppercase text-xl leading-none truncate">{it.beatTitle}</p>
                  <p className="font-sub uppercase text-xs tracking-wider text-vb-purple-bright mt-1">{it.tierName}</p>
                </div>
                <span className="font-display text-xl text-chrome">{formatCad(it.priceCents)}</span>
                <button
                  onClick={() => remove(it.beatId, it.tier)}
                  className="text-vb-muted hover:text-red-400"
                  aria-label="Remove"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary + form */}
          <div className="lg:col-span-2">
            <form onSubmit={checkout} className="bg-vb-ink border border-white/[0.06] rounded-2xl p-6 sticky top-24">
              <h2 className="font-display uppercase text-2xl mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between font-body text-vb-muted">
                  <span>Items</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/[0.06] pt-3">
                  <span className="font-sub uppercase tracking-wider text-vb-silver">Total</span>
                  <span className="font-display text-3xl text-chrome">{formatCad(totalCents)} <span className="text-base">CAD</span></span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <input
                  aria-label="Your name or artist name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name / artist name"
                  className="w-full bg-vb-black border border-white/10 rounded-lg px-3.5 py-3 font-body focus:border-vb-purple outline-none"
                />
                <input
                  aria-label="Email address for delivery"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email for your files"
                  className="w-full bg-vb-black border border-white/10 rounded-lg px-3.5 py-3 font-body focus:border-vb-purple outline-none"
                />
              </div>

              {error && (
                <p className="font-body text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg p-3 mb-4">
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 font-sub uppercase tracking-widest text-lg py-3.5 rounded-xl bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors glow-purple disabled:opacity-60"
              >
                <Lock size={16} />
                {loading ? "Processing…" : totalCents === 0 ? "Get Free License" : `Pay ${formatCad(totalCents)}`}
              </button>
              <p className="font-body text-xs text-vb-muted text-center mt-3 flex items-center justify-center gap-1.5">
                <Lock size={12} /> Secure checkout · instant delivery
              </p>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
