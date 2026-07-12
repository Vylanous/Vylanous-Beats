import { useLocation } from 'wouter';
import { Home, Music, ShoppingCart, Settings } from 'lucide-react';
import { useCart } from '../lib/cart';
import { shouldShowBottomNav } from '../lib/native-navigation';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

export function BottomNavigation() {
  const [location] = useLocation();
  const { items } = useCart();

  if (!shouldShowBottomNav(location)) {
    return null;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: <Home size={24} />, path: '/' },
    { id: 'beats', label: 'Beats', icon: <Music size={24} />, path: '/beats' },
    { id: 'cart', label: 'Cart', icon: <ShoppingCart size={24} />, path: '/cart', badge: items.length },
    { id: 'admin', label: 'Admin', icon: <Settings size={24} />, path: '/admin' },
  ];

  const isActive = (path: string): boolean => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-vb-ink border-t border-white/[0.06] safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <a
              key={item.id}
              href={item.path}
              className={`flex-1 flex flex-col items-center justify-center h-16 relative transition-colors ${
                active ? 'text-vb-purple-bright' : 'text-vb-muted hover:text-white'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                {item.icon}
                {item.badge ? (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-xs mt-1 font-sub uppercase tracking-wider">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
