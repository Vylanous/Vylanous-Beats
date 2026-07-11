import { useEffect } from "react";
import { CartProvider } from "../lib/cart";
import { PlayerProvider } from "../lib/player";
import { getAdminSettings } from "../lib/admin";

interface ProviderProps {
  children: React.ReactNode;
}

async function applySettings() {
  try {
    const res = await getAdminSettings();
    const s = res.settings || {};
    // apply theme colors as CSS variables
    if (s.theme) {
      const root = document.documentElement;
      if (s.theme.primary) root.style.setProperty("--vb-primary", s.theme.primary);
      if (s.theme.background) root.style.setProperty("--vb-bg", s.theme.background);
      if (s.theme.text) root.style.setProperty("--vb-text", s.theme.text);
    }
    // apply font family
    if (s.font && s.font.family) {
      document.documentElement.style.setProperty("--vb-font-family", s.font.family);
      document.body.style.fontFamily = s.font.family;
    }
    // set favicon if present (saves an S3 key or url)
    if (s.brand && (s.brand.faviconKey || s.brand.faviconUrl)) {
      const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
      link.setAttribute("rel", "icon");
      const href = s.brand.faviconUrl || `/api/admin/asset/${s.brand.faviconKey}`;
      link.setAttribute("href", href);
      if (!document.head.contains(link)) document.head.appendChild(link);
    }
  } catch (e) {
    console.error("failed to apply settings", e);
  }
}

export function Provider({ children }: ProviderProps) {
  useEffect(() => {
    applySettings();
  }, []);

  return (
    <CartProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </CartProvider>
  );
}
