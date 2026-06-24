import { CartProvider } from "../lib/cart";
import { PlayerProvider } from "../lib/player";

interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return (
    <CartProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </CartProvider>
  );
}
