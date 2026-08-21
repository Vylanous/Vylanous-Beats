import { CartProvider } from "../lib/cart-store";
import { PlayerProvider } from "../lib/player";
import { SiteSettingsProvider } from "../lib/site-settings";
import { CustomerProvider } from "../lib/customer";

interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return (
    <SiteSettingsProvider>
      <CustomerProvider>
        <CartProvider>
          <PlayerProvider>{children}</PlayerProvider>
        </CartProvider>
      </CustomerProvider>
    </SiteSettingsProvider>
  );
}
