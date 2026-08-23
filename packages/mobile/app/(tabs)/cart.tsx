import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCart } from "../../lib/cart";
import { TIER_BY_ID, formatPrice } from "../../lib/models";
export default function CartScreen() {
  const { items, remove, totalCents, hydrated } = useCart();
  if (!hydrated) return <View style={s.page} />;
  if (!items.length)
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>Your cart is clear.</Text>
        <Text style={s.emptyCopy}>Choose a beat and the license that fits your next release.</Text>
        <Pressable style={s.button} onPress={() => router.push("/(tabs)/beats")}>
          <Text style={s.buttonText}>BROWSE BEATS</Text>
        </Pressable>
      </View>
    );
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.title}>Your cart</Text>
      {items.map((item) => (
        <View key={item.beat.id} style={s.item}>
          <Image source={{ uri: item.beat.artworkUrl }} style={s.art} />
          <View style={{ flex: 1 }}>
            <Text style={s.itemTitle}>{item.beat.title}</Text>
            <Text style={s.tier}>{TIER_BY_ID[item.tier].name}</Text>
            <Text style={s.itemPrice}>{formatPrice(TIER_BY_ID[item.tier].priceCents)}</Text>
          </View>
          <Pressable onPress={() => remove(item.beat.id)}>
            <Text style={s.remove}>REMOVE</Text>
          </Pressable>
        </View>
      ))}
      <View style={s.total}>
        <Text style={s.totalLabel}>TOTAL</Text>
        <Text style={s.totalPrice}>{formatPrice(totalCents)}</Text>
      </View>
      <Pressable style={s.button} onPress={() => router.push("/checkout")}>
        <Text style={s.buttonText}>CONTINUE TO PURCHASE</Text>
      </Pressable>
      <Text style={s.note}>
        Secure purchases are completed through Apple or Google. License files are delivered to your
        email.
      </Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0A11" },
  content: { padding: 20 },
  title: { color: "#F8F6FB", fontSize: 30, fontWeight: "900", marginBottom: 18 },
  item: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#17141F",
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
    alignItems: "center",
  },
  art: { width: 58, height: 58, borderRadius: 10, backgroundColor: "#292630" },
  itemTitle: { color: "#F8F6FB", fontWeight: "800" },
  tier: { color: "#ABA6B5", fontSize: 11, marginTop: 3 },
  itemPrice: { color: "#E7D8FF", fontWeight: "900", marginTop: 5 },
  remove: { color: "#E3B6FF", fontSize: 9, fontWeight: "900" },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    paddingTop: 18,
    marginTop: 10,
  },
  totalLabel: { color: "#ABA6B5", fontWeight: "900", letterSpacing: 1 },
  totalPrice: { color: "#F8F6FB", fontSize: 22, fontWeight: "900" },
  button: {
    backgroundColor: "#A855F7",
    borderRadius: 14,
    alignItems: "center",
    padding: 16,
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  note: { color: "#817B8B", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 13 },
  empty: {
    flex: 1,
    backgroundColor: "#0B0A11",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: { color: "#F8F6FB", fontSize: 25, fontWeight: "900" },
  emptyCopy: { color: "#ABA6B5", textAlign: "center", lineHeight: 21, marginTop: 8 },
  emptyButton: {},
});
