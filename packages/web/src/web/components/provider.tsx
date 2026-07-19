import { CartProvider } from "../lib/cart";
import { PlayerProvider } from "../lib/player";
import { SiteSettingsProvider } from "../lib/site-settings";

interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return (
    <SiteSettingsProvider>
      <CartProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </CartProvider>
    </SiteSettingsProvider>
  );
}
