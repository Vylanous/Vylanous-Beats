import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../lib/cart";
import { font, vb } from "../../lib/theme";

export default function TabLayout() {
  const { items } = useCart();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: vb.purpleBright,
        tabBarInactiveTintColor: vb.muted,
        tabBarStyle: {
          backgroundColor: vb.black,
          borderTopColor: vb.border,
          height: 56 + bottomInset,
          paddingTop: 7,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: { fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 0.2 },
        tabBarBadgeStyle: {
          backgroundColor: vb.purple,
          color: vb.white,
          fontFamily: font.bodyBold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="beats"
        options={{
          title: "Beats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: items.length || undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
