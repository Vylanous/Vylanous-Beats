import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, LicenseTierId, Beat } from "./models";

const STORAGE_KEY = "vylanous-mobile-cart-v1";

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  add: (beat: Beat, tier: LicenseTierId) => void;
  remove: (beatId: string) => void;
  clear: () => void;
  totalCents: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function priceForTier(tier: LicenseTierId): number {
  return { free: 0, mp3: 2400, wav: 4900, unlimited: 9900, exclusive: 29900 }[tier];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) setItems(parsed as CartItem[]);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
  }, [hydrated, items]);

  const add = useCallback((beat: Beat, tier: LicenseTierId) => {
    setItems((current) => {
      const existing = current.findIndex((item) => item.beat.id === beat.id);
      if (existing < 0) return [...current, { beat, tier }];
      return current.map((item, index) => (index === existing ? { beat, tier } : item));
    });
  }, []);

  const remove = useCallback((beatId: string) => {
    setItems((current) => current.filter((item) => item.beat.id !== beatId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      add,
      remove,
      clear,
      totalCents: items.reduce((total, item) => total + priceForTier(item.tier), 0),
    }),
    [add, clear, hydrated, items, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
