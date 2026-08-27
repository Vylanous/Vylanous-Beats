import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../lib/cart";
import { useMobileAppSettings, type MobileTabId } from "../../lib/app-settings";
import { font, vb } from "../../lib/theme";

type TabDefinition = {
  id: MobileTabId;
  name: "index" | "beats" | "cart" | "library" | "profile";
  icon: keyof typeof Ionicons.glyphMap;
};

const tabsById: Record<MobileTabId, TabDefinition> = {
  home: { id: "home", name: "index", icon: "home-outline" },
  beats: { id: "beats", name: "beats", icon: "musical-notes-outline" },
  cart: { id: "cart", name: "cart", icon: "bag-outline" },
  library: { id: "library", name: "library", icon: "library-outline" },
  account: { id: "account", name: "profile", icon: "person-outline" },
};

export default function TabLayout() {
  const { items } = useCart();
  const insets = useSafeAreaInsets();
  const app = useMobileAppSettings();
  const systemBottom = Math.max(insets.bottom, 10);
  const floating = app.visual.bottomNavigationStyle === "floating";
  const barOffset = floating ? systemBottom + app.visual.bottomNavigationOffset : 0;
  const barHeight = 64;
  const contentClearance = floating ? barHeight + barOffset + 24 : 0;

  const tabSettings = new Map(app.navigation.tabs.map((tab) => [tab.id, tab]));
  const orderedTabs = app.navigation.tabs.map((setting) => tabsById[setting.id]);
  const isVisible = (id: MobileTabId) => {
    const visible = tabSettings.get(id)?.visible ?? true;
    if (id === "library") return visible && app.features.customerLibrary;
    if (id === "account") return visible && app.features.customerAccount;
    return visible;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { paddingBottom: contentClearance },
        tabBarActiveTintColor: vb.purpleBright,
        tabBarInactiveTintColor: vb.muted,
        tabBarStyle: {
          backgroundColor: "rgba(19,19,24,0.98)",
          borderTopColor: vb.border,
          borderWidth: floating ? 1 : 0,
          height: floating ? barHeight : barHeight + systemBottom,
          paddingTop: 6,
          paddingBottom: floating ? 6 : systemBottom,
          position: floating ? "absolute" : "relative",
          bottom: floating ? barOffset : 0,
          left: floating ? 14 : 0,
          right: floating ? 14 : 0,
          borderRadius: floating ? 16 : 0,
          shadowColor: "#000000",
          shadowOpacity: floating ? 0.42 : 0,
          shadowRadius: floating ? 20 : 0,
          shadowOffset: { width: 0, height: 10 },
          elevation: floating ? 18 : 0,
        },
        tabBarLabelStyle: {
          fontFamily: font.sub,
          fontSize: 13,
          lineHeight: 14,
          letterSpacing: 0.55,
        },
        tabBarBadgeStyle: {
          backgroundColor: vb.purple,
          color: vb.white,
          fontFamily: font.bodyBold,
        },
      }}
    >
      {orderedTabs.map((tab) => {
        const setting = tabSettings.get(tab.id);
        return (
          <Tabs.Screen
            key={tab.id}
            name={tab.name}
            options={{
              title: setting?.label || tab.id,
              href: isVisible(tab.id) ? undefined : null,
              tabBarBadge: tab.id === "cart" ? items.length || undefined : undefined,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={tab.icon} color={color} size={size} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
