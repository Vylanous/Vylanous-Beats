import { Link } from "wouter";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../lib/cart";
import { formatCad } from "../../shared/licenses";

export function CartDrawer() {
  const { items, open, setOpen, remove, totalCents } = useCart();

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close cart"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[61] h-full w-full max-w-md bg-vb-ink border-l border-white/10 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/[0.06]">
          <h2 className="font-display text-2xl uppercase">Your Cart</h2>
          <button
            onClick={() => setOpen(false)}
            className="grid place-items-center w-9 h-9 rounded-lg bg-vb-black border border-white/10 hover:border-vb-purple/60"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-vb-muted">
              <ShoppingBag size={40} className="opacity-40" />
              <p className="font-body">Your cart is empty.</p>
              <Link
                to="/beats"
                onClick={() => setOpen(false)}
                className="font-sub uppercase tracking-wider text-vb-purple-bright hover:underline"
              >
                Browse beats
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.beatId + it.tier}
                  className="flex items-center gap-3 bg-vb-black rounded-xl p-3 border border-white/[0.06]"
                >
                  <img src={it.artworkUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display uppercase text-lg leading-none truncate">
                      {it.beatTitle}
                    </p>
                    <p className="font-sub uppercase text-xs text-vb-purple-bright tracking-wider mt-1">
                      {it.tierName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-lg text-chrome">{formatCad(it.priceCents)}</p>
                    <button
                      onClick={() => remove(it.beatId, it.tier)}
                      className="text-vb-muted hover:text-red-400 mt-1"
                      aria-label="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-white/[0.06] px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-sub uppercase tracking-wider text-vb-silver">Total</span>
              <span className="font-display text-3xl text-chrome">{formatCad(totalCents)} CAD</span>
            </div>
            <Link
              to="/cart"
              onClick={() => setOpen(false)}
              className="block w-full text-center font-sub uppercase tracking-widest text-lg py-3.5 rounded-xl bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors glow-purple"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
