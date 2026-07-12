import { ReactNode, useEffect } from 'react';
import { CartProvider } from '../hooks/use-cart-context';
import { initializeCapacitor, initializePushNotifications } from '../lib/capacitor-bridge';
import { registerServiceWorker } from '../lib/push-notifications';
import { isNativeApp } from '../lib/native-navigation';

interface ProviderProps {
  children: ReactNode;
}

export function Provider({ children }: ProviderProps) {
  useEffect(() => {
    // Initialize based on environment
    const init = async () => {
      if (isNativeApp()) {
        // Running in Capacitor or Electron
        await initializeCapacitor();
        await initializePushNotifications();
      } else {
        // Running in browser - register service worker for PWA
        await registerServiceWorker();
      }
    };
    init();
  }, []);

  return <CartProvider>{children}</CartProvider>;
}
