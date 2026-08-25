import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandHeader } from "../../components/BrandHeader";
import { ScreenCanvas } from "../../components/ScreenCanvas";
import { useCart } from "../../lib/cart";
import { TIER_BY_ID, formatPrice } from "../../lib/models";
import { radius, type, vb } from "../../lib/theme";

export default function CartScreen() {
  const { items, remove, totalCents, hydrated } = useCart();
  if (!hydrated) return <ScreenCanvas />;

  if (!items.length) {
    return (
      <ScreenCanvas>
        <View style={s.empty}>
          <BrandHeader eyebrow="YOUR CART" />
          <Text style={s.emptyTitle}>YOUR CART IS CLEAR.</Text>
          <Text style={s.emptyCopy}>
            Choose a beat and the license that fits your next release.
          </Text>
          <Pressable style={s.button} onPress={() => router.push("/(tabs)/beats")}>
            <Text style={s.buttonText}>BROWSE BEATS</Text>
          </Pressable>
        </View>
      </ScreenCanvas>
    );
  }

  return (
    <ScreenCanvas>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <BrandHeader eyebrow="YOUR CART" />
        <Text style={s.title}>YOUR CART</Text>
        {items.map((item) => (
          <View key={item.beat.id} style={s.item}>
            <Image source={{ uri: item.beat.artworkUrl }} style={s.art} />
            <View style={s.itemCopy}>
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
          Secure purchases are completed through Apple or Google. License files are delivered to
          your email.
        </Text>
      </ScrollView>
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 136 },
  title: { ...type.pageTitle, color: vb.silverBright, marginTop: 20, marginBottom: 18 },
  item: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(19,19,24,0.92)",
    padding: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: vb.border,
    marginBottom: 10,
    alignItems: "center",
  },
  art: { width: 60, height: 60, borderRadius: radius.card, backgroundColor: vb.ink2 },
  itemCopy: { flex: 1 },
  itemTitle: { ...type.section, color: vb.silverBright, fontSize: 21, lineHeight: 23 },
  tier: { ...type.body, color: vb.silver, fontSize: 13, lineHeight: 17, marginTop: 3 },
  itemPrice: {
    ...type.section,
    color: vb.purpleBright,
    fontSize: 20,
    lineHeight: 22,
    marginTop: 5,
  },
  remove: { ...type.button, color: vb.silver, fontSize: 9 },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: vb.border,
    paddingTop: 18,
    marginTop: 12,
  },
  totalLabel: { ...type.eyebrow, color: vb.silver },
  totalPrice: { ...type.section, color: vb.silverBright, fontSize: 28, lineHeight: 30 },
  button: {
    backgroundColor: vb.purple,
    borderRadius: radius.card,
    alignItems: "center",
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(162,77,245,0.74)",
    shadowColor: vb.purpleBright,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  buttonText: { ...type.button, color: vb.white },
  note: {
    ...type.body,
    color: vb.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 14,
  },
  empty: { flex: 1, paddingHorizontal: 22, paddingTop: 18, justifyContent: "center" },
  emptyTitle: { ...type.pageTitle, color: vb.silverBright, marginTop: 20 },
  emptyCopy: { ...type.body, color: vb.silver, marginTop: 10 },
});
