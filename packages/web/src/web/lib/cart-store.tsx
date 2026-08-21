import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

interface CartContextValue {
  items: CartLine[];
  count: number;
  totalCents: number;
  add: (line: CartLine) => void;
  remove: (beatId: string, tier: LicenseTierId) => void;
  clear: () => void;
  has: (beatId: string, tier: LicenseTierId) => boolean;
}

const STORAGE_KEY = "vb_cart_clean_v1";
const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartLine =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as CartLine).beatId === "string" &&
        typeof (item as CartLine).tier === "string" &&
        typeof (item as CartLine).priceCents === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(readStoredCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Cart still works for the current session when storage is unavailable.
    }
  }, [items]);

  const add = useCallback((line: CartLine) => {
    setItems((current) =>
      current.some(
        (item) => item.beatId === line.beatId && item.tier === line.tier,
      )
        ? current
        : [...current, line],
    );
  }, []);

  const remove = useCallback((beatId: string, tier: LicenseTierId) => {
    setItems((current) =>
      current.filter((item) => !(item.beatId === beatId && item.tier === tier)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const has = useCallback(
    (beatId: string, tier: LicenseTierId) =>
      items.some((item) => item.beatId === beatId && item.tier === tier),
    [items],
  );
  const totalCents = useMemo(
    () => items.reduce((total, item) => total + item.priceCents, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        totalCents,
        add,
        remove,
        clear,
        has,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
