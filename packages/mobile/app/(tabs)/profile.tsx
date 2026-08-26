import * as Linking from "expo-linking";
import { useCallback } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BrandHeader } from "../../components/BrandHeader";
import { ChromeText } from "../../components/ChromeText";
import { ScreenCanvas } from "../../components/ScreenCanvas";
import { entitlementDownload, updateCustomerPreferences } from "../../lib/api";
import { useCustomer } from "../../lib/customer";
import { formatPrice } from "../../lib/models";
import { font, radius, type, vb } from "../../lib/theme";

export default function ProfileScreen() {
  const { ready, customer, dashboard, refreshDashboard, resendVerification, signOut } =
    useCustomer();
  const dashboardQuery = useQuery({
    queryKey: ["customer-dashboard", customer?.id],
    queryFn: refreshDashboard,
    enabled: Boolean(customer),
  });

  const download = useCallback(async (id: string) => {
    try {
      const { url } = await entitlementDownload(id);
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Download unavailable",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }, []);

  const resend = useCallback(async () => {
    try {
      await resendVerification();
      Alert.alert("Verification email sent", "Check your inbox for a fresh verification link.");
    } catch (error) {
      Alert.alert(
        "Could not resend email",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }, [resendVerification]);

  const toggleNewsletter = useCallback(
    async (value: boolean) => {
      try {
        await updateCustomerPreferences({ marketingOptIn: value });
        await refreshDashboard();
      } catch (error) {
        Alert.alert(
          "Preference not saved",
          error instanceof Error ? error.message : "Please try again.",
        );
      }
    },
    [refreshDashboard],
  );

  if (!ready) return <ScreenCanvas />;

  if (!customer || !dashboard) {
    return (
      <ScreenCanvas>
        <View style={s.guestContent}>
          <BrandHeader eyebrow="CUSTOMER PORTAL" />
          <ChromeText style={s.title}>YOUR MUSIC VAULT</ChromeText>
          <Text style={s.copy}>
            Sign in to see your licenses, purchase history, secure downloads, and account insights.
          </Text>
          <Pressable style={s.primary} onPress={() => router.push("/login")}>
            <Text style={s.primaryText}>SIGN IN OR CREATE ACCOUNT</Text>
          </Pressable>
        </View>
      </ScreenCanvas>
    );
  }

  return (
    <ScreenCanvas>
      <FlatList
        style={s.list}
        contentContainerStyle={s.content}
        data={dashboard.entitlements}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={dashboardQuery.isRefetching}
            onRefresh={() => refreshDashboard()}
            tintColor={vb.purpleBright}
          />
        }
        ListHeaderComponent={
          <>
            <BrandHeader eyebrow="CUSTOMER PORTAL" />
            <ChromeText style={s.title}>{customer.displayName || "YOUR MUSIC VAULT"}</ChromeText>
            <Text style={s.email}>{customer.email}</Text>
            {!customer.emailVerified && (
              <View style={s.verification}>
                <View style={s.verificationCopy}>
                  <Text style={s.cardTitle}>VERIFY YOUR EMAIL</Text>
                  <Text style={s.cardBody}>
                    Verify your email to unlock the full catalog, purchases, and mobile license
                    delivery.
                  </Text>
                </View>
                <Pressable onPress={resend} style={s.verifyButton}>
                  <Text style={s.verifyButtonText}>RESEND</Text>
                </Pressable>
              </View>
            )}
            <View style={s.insights}>
              <Insight label="LICENSES" value={String(dashboard.insights.licensesOwned)} />
              <Insight label="ORDERS" value={String(dashboard.insights.paidOrders)} />
              <Insight label="INVESTED" value={formatPrice(dashboard.insights.totalSpentCents)} />
            </View>
            <View style={s.newsletter}>
              <View style={s.newsletterCopy}>
                <Text style={s.cardTitle}>STUDIO NOTES & EARLY DROPS</Text>
                <Text style={s.cardBody}>
                  Control release updates and occasional offers from your account.
                </Text>
              </View>
              <Switch
                value={customer.marketingOptIn}
                onValueChange={toggleNewsletter}
                trackColor={{ false: "#40394A", true: vb.purple }}
                thumbColor={vb.silverBright}
              />
            </View>
            <View style={s.sectionHead}>
              <ChromeText style={s.sectionTitle}>LICENSE LIBRARY</ChromeText>
              <Pressable onPress={() => router.push("/(tabs)/beats")}>
                <Text style={s.link}>BROWSE BEATS</Text>
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={s.license}>
            <View style={s.licenseCopy}>
              <ChromeText style={s.licenseTitle}>{item.beatTitle}</ChromeText>
              <Text style={s.licenseTier}>{item.licenseName}</Text>
            </View>
            <Pressable style={s.download} onPress={() => download(item.id)}>
              <Text style={s.downloadText}>DOWNLOAD</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>
            Your confirmed licenses will appear here. Browse the catalog to find your next sound.
          </Text>
        }
        ListFooterComponent={
          <Pressable style={s.signOut} onPress={signOut}>
            <Text style={s.signOutText}>SIGN OUT</Text>
          </Pressable>
        }
      />
    </ScreenCanvas>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.insight}>
      <ChromeText style={s.insightValue}>{value}</ChromeText>
      <Text style={s.insightLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: "transparent" },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 136 },
  guestContent: { flex: 1, paddingHorizontal: 22, paddingTop: 18 },
  title: {
    ...type.pageTitle,
    marginTop: 20,
  },
  email: {
    fontFamily: font.bodyMedium,
    color: vb.silver,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 5,
  },
  copy: { ...type.body, color: vb.silver, marginTop: 14, maxWidth: 340 },
  primary: {
    alignSelf: "flex-start",
    marginTop: 24,
    backgroundColor: vb.purple,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(162,77,245,0.74)",
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: vb.purpleBright,
    shadowOpacity: 0.48,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  primaryText: { ...type.button, color: vb.white },
  insights: { flexDirection: "row", gap: 8, marginTop: 24 },
  insight: {
    flex: 1,
    padding: 13,
    backgroundColor: "rgba(19,19,24,0.92)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(124,47,203,0.36)",
  },
  insightValue: { ...type.section, fontSize: 22, lineHeight: 24 },
  insightLabel: {
    ...type.eyebrow,
    color: vb.muted,
    fontSize: 8,
    marginTop: 7,
  },
  verification: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(74,20,128,0.32)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(162,77,245,0.62)",
    padding: 14,
    marginTop: 18,
    shadowColor: vb.purple,
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  verificationCopy: { flex: 1 },
  verifyButton: {
    backgroundColor: vb.purple,
    borderRadius: radius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  verifyButtonText: { ...type.button, color: vb.white, fontSize: 10 },
  newsletter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    backgroundColor: "rgba(19,19,24,0.92)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: vb.border,
    padding: 14,
  },
  newsletterCopy: { flex: 1 },
  cardTitle: { ...type.eyebrow, color: vb.silverBright },
  cardBody: { ...type.body, color: vb.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 10,
  },
  sectionTitle: { ...type.section, fontSize: 20, lineHeight: 22 },
  link: { ...type.button, color: vb.purpleBright, fontSize: 10 },
  license: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(19,19,24,0.92)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: vb.border,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  licenseCopy: { flex: 1 },
  licenseTitle: { ...type.section, fontSize: 21, lineHeight: 23 },
  licenseTier: { ...type.body, color: vb.silver, fontSize: 13, lineHeight: 17, marginTop: 3 },
  download: {
    borderWidth: 1,
    borderColor: "rgba(162,77,245,0.75)",
    borderRadius: radius.card,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  downloadText: { ...type.button, color: vb.purpleBright, fontSize: 10 },
  empty: { ...type.body, color: vb.muted, marginTop: 4 },
  signOut: { alignSelf: "flex-start", marginTop: 30, paddingVertical: 10 },
  signOutText: { ...type.button, color: vb.silver, fontSize: 10 },
});
