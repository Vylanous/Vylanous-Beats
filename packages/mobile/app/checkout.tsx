import { router } from "expo-router";
import { useIAP } from "expo-iap";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BrandHeader } from "../components/BrandHeader";
import { ScreenCanvas } from "../components/ScreenCanvas";
import { fulfillFreeLicense, fulfillMobilePurchase } from "../lib/api";
import { useCart } from "../lib/cart";
import { useCustomer } from "../lib/customer";
import { MOBILE_PRODUCT_BY_TIER, TIER_BY_ID } from "../lib/models";
import { font, radius, type, vb } from "../lib/theme";

export default function Checkout() {
  const { items, clear } = useCart();
  const { customer, refreshDashboard } = useCustomer();
  const [busy, setBusy] = useState(false);
  const { requestPurchase, finishTransaction } = useIAP();
  const item = items[0];

  if (!item) {
    return (
      <ScreenCanvas>
        <View style={s.content}>
          <BrandHeader eyebrow="SECURE CHECKOUT" />
          <Text style={s.title}>YOUR CART IS EMPTY.</Text>
        </View>
      </ScreenCanvas>
    );
  }

  const tier = TIER_BY_ID[item.tier];

  if (!customer) {
    return (
      <ScreenCanvas>
        <View style={s.content}>
          <BrandHeader eyebrow="SECURE CHECKOUT" />
          <Pressable onPress={() => router.back()} style={s.backButton}>
            <Text style={s.back}>‹ BACK</Text>
          </Pressable>
          <Text style={s.title}>SIGN IN TO PURCHASE</Text>
          <Text style={s.copy}>
            Your account keeps every license, receipt, and secure download together across the app
            and website.
          </Text>
          <Pressable style={s.button} onPress={() => router.push("/login")}>
            <Text style={s.buttonText}>SIGN IN OR CREATE ACCOUNT</Text>
          </Pressable>
        </View>
      </ScreenCanvas>
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
    <ScreenCanvas>
      <View style={s.content}>
        <BrandHeader eyebrow="SECURE CHECKOUT" />
        <Pressable onPress={() => router.back()} style={s.backButton}>
          <Text style={s.back}>‹ BACK</Text>
        </Pressable>
        <Text style={s.title}>FINISH YOUR LICENSE</Text>
        <Text style={s.beat}>{item.beat.title}</Text>
        <Text style={s.tier}>{tier.name}</Text>
        <Text style={s.account}>PURCHASING AS {customer.email}</Text>
        <Pressable disabled={busy} style={[s.button, busy && s.buttonDisabled]} onPress={pay}>
          <Text style={s.buttonText}>
            {busy ? "CONFIRMING…" : `BUY ${tier.name.toUpperCase()}`}
          </Text>
        </Pressable>
        <Text style={s.note}>
          Payment is securely handled by {Platform.OS === "ios" ? "Apple" : "Google Play"}. Verified
          purchases and downloads are added to your account.
        </Text>
      </View>
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 18 },
  backButton: { alignSelf: "flex-start", marginTop: 18 },
  back: { ...type.button, color: vb.purpleBright, fontSize: 11 },
  title: { ...type.pageTitle, color: vb.silverBright, marginTop: 20 },
  beat: { ...type.section, color: vb.silverBright, marginTop: 22 },
  tier: { ...type.body, color: vb.purpleBright, marginTop: 5 },
  account: { ...type.eyebrow, color: vb.muted, marginTop: 22 },
  copy: { ...type.body, color: vb.silver, marginTop: 14, maxWidth: 340 },
  button: {
    backgroundColor: vb.purple,
    borderRadius: radius.card,
    alignItems: "center",
    padding: 16,
    marginTop: 28,
    borderWidth: 1,
    borderColor: "rgba(162,77,245,0.74)",
    shadowColor: vb.purpleBright,
    shadowOpacity: 0.48,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...type.button, color: vb.white, fontFamily: font.bodyBold },
  note: {
    ...type.body,
    color: vb.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 17,
  },
});
