/**
 * Native navigation patterns for mobile app
 * Implements bottom navigation and native-like transitions
 */

export type NavigationTab = 'home' | 'beats' | 'cart' | 'admin';

export interface NavigationState {
  currentTab: NavigationTab;
  previousTab?: NavigationTab;
}

const navigationState: NavigationState = {
  currentTab: 'home',
};

export function getCurrentTab(): NavigationTab {
  return navigationState.currentTab;
}

export function setCurrentTab(tab: NavigationTab): void {
  navigationState.previousTab = navigationState.currentTab;
  navigationState.currentTab = tab;
}

/**
 * Determines if we should show bottom nav
 * (hidden on admin/checkout pages)
 */
export function shouldShowBottomNav(pathname: string): boolean {
  const hiddenPaths = ['/admin', '/cart', '/success', '/checkout'];
  return !hiddenPaths.some((path) => pathname.startsWith(path));
}

/**
 * Get route for tab
 */
export function getTabRoute(tab: NavigationTab): string {
  const routes: Record<NavigationTab, string> = {
    home: '/',
    beats: '/beats',
    cart: '/cart',
    admin: '/admin',
  };
  return routes[tab];
}

/**
 * Detects if we're running in a native app context
 */
export function isNativeApp(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isCapacitor = !!((window as any).Capacitor);
  const isElectron = !!(window as any).electron;
  return isCapacitor || isElectron;
}

/**
 * Safe navigation that respects native back button
 */
export function navigateTo(path: string): void {
  if (isNativeApp()) {
    // Use hash-based routing for better native integration
    window.location.hash = path;
  } else {
    window.location.href = path;
  }
}
