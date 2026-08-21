import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { LicenseTierId } from "../../shared/licenses";

export interface CartLine {
  beatId: string;
  beatTitle: string;
  artworkUrl: string;
  tier: LicenseTierId;
  tierName: string;
  priceCents: number;
}

interface CartCtx {
  items: CartLine[];
  add: (line: CartLine) => void;
  remove: (beatId: string, tier: LicenseTierId) => void;
  clear: () => void;
  has: (beatId: string, tier: LicenseTierId) => boolean;
  count: number;
  totalCents: number;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "vb_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((line: CartLine) => {
    setItems((prev) => {
      if (prev.some((i) => i.beatId === line.beatId && i.tier === line.tier))
        return prev;
      return [...prev, line];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((beatId: string, tier: LicenseTierId) => {
    setItems((prev) =>
      prev.filter((i) => !(i.beatId === beatId && i.tier === tier)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const has = useCallback(
    (beatId: string, tier: LicenseTierId) =>
      items.some((i) => i.beatId === beatId && i.tier === tier),
    [items],
  );

  const totalCents = items.reduce((s, i) => s + i.priceCents, 0);

  return (
    <Ctx.Provider
      value={{
        items,
        add,
        remove,
        clear,
        has,
        count: items.length,
        totalCents,
        open,
        setOpen,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
