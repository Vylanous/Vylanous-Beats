import { router } from "expo-router";
import { useIAP } from "expo-iap";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader } from "../components/BrandHeader";
import { fulfillFreeLicense, fulfillMobilePurchase } from "../lib/api";
import { useCart } from "../lib/cart";
import { useCustomer } from "../lib/customer";
import { MOBILE_PRODUCT_BY_TIER, TIER_BY_ID } from "../lib/models";

export default function Checkout() {
  const { items, clear } = useCart();
  const { customer, refreshDashboard } = useCustomer();
  const [busy, setBusy] = useState(false);
  const { requestPurchase, finishTransaction } = useIAP();
  const item = items[0];

  if (!item) {
    return (
      <SafeAreaView style={s.page} edges={["top"]}>
        <BrandHeader eyebrow="SECURE CHECKOUT" />
        <Text style={s.title}>Your cart is empty.</Text>
      </SafeAreaView>
    );
  }

  const tier = TIER_BY_ID[item.tier];

  if (!customer) {
    return (
      <SafeAreaView style={s.page} edges={["top"]}>
        <BrandHeader eyebrow="SECURE CHECKOUT" />
        <Pressable onPress={() => router.back()} style={s.backButton}>
          <Text style={s.back}>‹ BACK</Text>
        </Pressable>
        <Text style={s.title}>Sign in to purchase</Text>
        <Text style={s.copy}>
          Your account keeps every license, receipt, and secure download together across the app and
          website.
        </Text>
        <Pressable style={s.button} onPress={() => router.push("/login")}>
          <Text style={s.buttonText}>SIGN IN OR CREATE ACCOUNT</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const pay = async () => {
    if (item.tier === "free") {
      setBusy(true);
      try {
        await fulfillFreeLicense({ beatId: item.beat.id });
        await refreshDashboard();
        clear();
        Alert.alert("Free license confirmed", "Your license is now in your music vault.", [
          { text: "Open vault", onPress: () => router.replace("/(tabs)/profile") },
        ]);
      } catch (error) {
        Alert.alert(
          "License not completed",
          error instanceof Error ? error.message : "Please try again.",
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const sku = MOBILE_PRODUCT_BY_TIER[item.tier];
      const result = await requestPurchase({
        request: { apple: { sku }, google: { skus: [sku] } },
        type: "in-app",
      });
      const purchase = Array.isArray(result) ? result[0] : result;
      if (!purchase) throw new Error("No storefront transaction was returned.");
      await fulfillMobilePurchase({
        platform: Platform.OS === "ios" ? "apple" : "google",
        environment: __DEV__ ? "sandbox" : "production",
        transactionId: purchase.id,
        purchaseToken: purchase.purchaseToken ?? undefined,
        productId: sku,
        beatId: item.beat.id,
        tier: item.tier,
      });
      await finishTransaction({ purchase, isConsumable: true });
      await refreshDashboard();
      clear();
      Alert.alert(
        "License confirmed",
        "Your license is verified and available in your music vault.",
        [{ text: "Open vault", onPress: () => router.replace("/(tabs)/profile") }],
      );
    } catch (error) {
      Alert.alert(
        "Purchase not completed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <BrandHeader eyebrow="SECURE CHECKOUT" />
      <Pressable onPress={() => router.back()} style={s.backButton}>
        <Text style={s.back}>‹ BACK</Text>
      </Pressable>
      <Text style={s.title}>Finish your license</Text>
      <Text style={s.beat}>{item.beat.title}</Text>
      <Text style={s.tier}>{tier.name}</Text>
      <Text style={s.account}>Purchasing as {customer.email}</Text>
      <Pressable disabled={busy} style={[s.button, busy && { opacity: 0.6 }]} onPress={pay}>
        <Text style={s.buttonText}>{busy ? "CONFIRMING…" : `BUY ${tier.name.toUpperCase()}`}</Text>
      </Pressable>
      <Text style={s.note}>
        Payment is securely handled by {Platform.OS === "ios" ? "Apple" : "Google Play"}. Verified
        purchases and downloads are added to your account.
      </Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0A11", padding: 22 },
  backButton: { alignSelf: "flex-start", marginTop: 22 },
  back: { color: "#CDA8FF", fontWeight: "900", fontSize: 11 },
  title: { color: "#F8F6FB", fontSize: 31, fontWeight: "900", marginTop: 22 },
  beat: { color: "#E7D8FF", fontSize: 18, fontWeight: "800", marginTop: 20 },
  tier: { color: "#ABA6B5", marginTop: 5 },
  account: { color: "#817B8B", fontSize: 12, marginTop: 20 },
  copy: { color: "#ABA6B5", fontSize: 14, lineHeight: 21, marginTop: 12 },
  button: {
    backgroundColor: "#A855F7",
    borderRadius: 14,
    alignItems: "center",
    padding: 16,
    marginTop: 28,
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  note: { color: "#817B8B", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 17 },
});
