import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Lock, ArrowRight, ShoppingBag } from "lucide-react";
import { Layout } from "../components/layout";
import { useCart } from "../lib/cart-store";
import { customerFetch, useCustomer } from "../lib/customer";
import { formatCad } from "../../shared/licenses";

export default function CartPage() {
  const { items, remove, totalCents, clear } = useCart();
  const { customer } = useCustomer();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cartFingerprint = useMemo(
    () =>
      items
        .map((item) => `${item.beatId}:${item.tier}`)
        .sort()
        .join("|"),
    [items],
  );
  const idempotencyKey = useRef(crypto.randomUUID());
  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID();
  }, [cartFingerprint]);
  const checkout = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await customerFetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((item) => ({
            beatId: item.beatId,
            tier: item.tier,
          })),
          idempotencyKey: idempotencyKey.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Checkout failed. Try again.");
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
        window.location.href = data.url;
        return;
      }
      setError("Unexpected response.");
      setLoading(false);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };
  if (items.length === 0)
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-5 pb-24 pt-40 text-center">
          <ShoppingBag size={48} className="mx-auto text-vb-muted opacity-40" />
          <h1 className="mt-4 font-display text-5xl uppercase text-chrome">Cart Empty</h1>
          <p className="mt-2 font-body text-vb-muted">Go find something that knocks.</p>
          <Link
            to="/beats"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-vb-purple px-7 py-3.5 font-sub text-lg uppercase tracking-widest text-white hover:bg-vb-purple-bright"
          >
            Browse Beats <ArrowRight size={18} />
          </Link>
        </div>
      </Layout>
    );
  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8">
        <h1 className="mb-10 font-display text-6xl uppercase leading-none text-chrome sm:text-7xl">
          Checkout
        </h1>
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-3">
            {items.map((item) => (
              <div
                key={item.beatId + item.tier}
                className="flex items-center gap-4 rounded-xl border border-white/[.06] bg-vb-ink p-4"
              >
                <img src={item.artworkUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl uppercase leading-none">
                    {item.beatTitle}
                  </p>
                  <p className="mt-1 font-sub text-xs uppercase tracking-wider text-vb-purple-bright">
                    {item.tierName}
                  </p>
                </div>
                <span className="font-display text-xl text-chrome">
                  {formatCad(item.priceCents)}
                </span>
                <button
                  onClick={() => remove(item.beatId, item.tier)}
                  className="text-vb-muted hover:text-red-400"
                  aria-label="Remove"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            {!customer ? (
              <div className="sticky top-24 rounded-2xl border border-vb-purple/30 bg-vb-ink p-6">
                <Lock className="text-vb-purple-bright" size={22} />
                <h2 className="mt-4 font-display text-3xl uppercase">Sign in to purchase</h2>
                <p className="mt-3 font-body text-sm leading-6 text-vb-silver/60">
                  Purchases and downloads are attached to your customer account, so every license is
                  available in your website and mobile music vault.
                </p>
                <Link
                  to="/login"
                  className="mt-6 inline-flex rounded-xl bg-vb-purple px-4 py-3 font-sub text-sm uppercase tracking-wide text-white hover:bg-vb-purple-bright"
                >
                  Sign in or create account
                </Link>
              </div>
            ) : (
              <form
                onSubmit={checkout}
                className="sticky top-24 rounded-2xl border border-white/[.06] bg-vb-ink p-6"
              >
                <h2 className="mb-4 font-display text-2xl uppercase">Order Summary</h2>
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between font-body text-vb-muted">
                    <span>Items</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[.06] pt-3">
                    <span className="font-sub uppercase tracking-wider text-vb-silver">Total</span>
                    <span className="font-display text-3xl text-chrome">
                      {formatCad(totalCents)} <span className="text-base">CAD</span>
                    </span>
                  </div>
                </div>
                <div className="mb-4 rounded-xl border border-white/[.07] bg-vb-black/30 p-3 font-body text-sm text-vb-silver/65">
                  License delivery and your secure music vault will be tied to{" "}
                  <strong className="font-medium text-vb-silver-bright">{customer.email}</strong>.
                </div>
                {error && (
                  <p className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 font-body text-sm text-amber-400">
                    {error}
                  </p>
                )}
                <button
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-vb-purple py-3.5 font-sub text-lg uppercase tracking-widest text-white transition hover:bg-vb-purple-bright disabled:opacity-60"
                >
                  <Lock size={16} />
                  {loading
                    ? "Processing…"
                    : totalCents === 0
                      ? "Get Free License"
                      : `Pay ${formatCad(totalCents)}`}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-body text-xs text-vb-muted">
                  <Lock size={12} /> Secure checkout · saved to your vault
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
