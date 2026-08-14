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
import { entitlementDownload, updateCustomerPreferences } from "../../lib/api";
import { useCustomer } from "../../lib/customer";
import { formatPrice } from "../../lib/models";

export default function ProfileScreen() {
  const { ready, customer, dashboard, refreshDashboard, signOut } = useCustomer();
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

  if (!ready) return <View style={s.page} />;
  if (!customer || !dashboard) {
    return (
      <View style={s.page}>
        <Text style={s.eyebrow}>CUSTOMER PORTAL</Text>
        <Text style={s.title}>Your music vault</Text>
        <Text style={s.copy}>
          Sign in to see your licenses, purchase history, secure downloads, and account insights.
        </Text>
        <Pressable style={s.primary} onPress={() => router.push("/login")}>
          <Text style={s.primaryText}>SIGN IN OR CREATE ACCOUNT</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <FlatList
      style={s.page}
      contentContainerStyle={s.content}
      data={dashboard.entitlements}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={dashboardQuery.isRefetching}
          onRefresh={() => refreshDashboard()}
          tintColor="#DDBDFF"
        />
      }
      ListHeaderComponent={
        <>
          <Text style={s.eyebrow}>CUSTOMER PORTAL</Text>
          <Text style={s.title}>{customer.displayName || "Your music vault"}</Text>
          <Text style={s.email}>{customer.email}</Text>
          <View style={s.insights}>
            <Insight label="LICENSES" value={String(dashboard.insights.licensesOwned)} />
            <Insight label="ORDERS" value={String(dashboard.insights.paidOrders)} />
            <Insight label="INVESTED" value={formatPrice(dashboard.insights.totalSpentCents)} />
          </View>
          <View style={s.newsletter}>
            <View style={s.newsletterCopy}>
              <Text style={s.cardTitle}>Studio notes & early drops</Text>
              <Text style={s.cardBody}>
                Control release updates and occasional offers from your account.
              </Text>
            </View>
            <Switch
              value={customer.marketingOptIn}
              onValueChange={toggleNewsletter}
              trackColor={{ false: "#40394A", true: "#7E22CE" }}
              thumbColor="#F8F6FB"
            />
          </View>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>LICENSE LIBRARY</Text>
            <Pressable onPress={() => router.push("/(tabs)/beats")}>
              <Text style={s.link}>BROWSE UPSELLS</Text>
            </Pressable>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <View style={s.license}>
          <View style={s.licenseCopy}>
            <Text style={s.licenseTitle}>{item.beatTitle}</Text>
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
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.insight}>
      <Text style={s.insightValue}>{value}</Text>
      <Text style={s.insightLabel}>{label}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0A11" },
  content: { padding: 22, paddingTop: 24, paddingBottom: 42 },
  eyebrow: { color: "#B982FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#F8F6FB", fontSize: 31, fontWeight: "900", marginTop: 7 },
  email: { color: "#ABA6B5", marginTop: 5 },
  copy: { color: "#ABA6B5", fontSize: 14, lineHeight: 21, marginTop: 12 },
  primary: {
    marginTop: 22,
    backgroundColor: "#A855F7",
    borderRadius: 14,
    alignItems: "center",
    padding: 16,
  },
  primaryText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  insights: { flexDirection: "row", gap: 8, marginTop: 22 },
  insight: {
    flex: 1,
    padding: 12,
    backgroundColor: "#17141F",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.07)",
  },
  insightValue: { color: "#F8F6FB", fontSize: 17, fontWeight: "900" },
  insightLabel: {
    color: "#817B8B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginTop: 5,
  },
  newsletter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    backgroundColor: "#17141F",
    padding: 14,
    borderRadius: 14,
  },
  newsletterCopy: { flex: 1 },
  cardTitle: { color: "#F8F6FB", fontSize: 13, fontWeight: "800" },
  cardBody: { color: "#817B8B", fontSize: 11, lineHeight: 16, marginTop: 3 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 10,
  },
  sectionTitle: { color: "#DDBDFF", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  link: { color: "#B982FF", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  license: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17141F",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  licenseCopy: { flex: 1 },
  licenseTitle: { color: "#F8F6FB", fontWeight: "900", fontSize: 15 },
  licenseTier: { color: "#ABA6B5", fontSize: 11, marginTop: 3 },
  download: {
    borderWidth: 1,
    borderColor: "#A855F7",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  downloadText: { color: "#DDBDFF", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  empty: { color: "#817B8B", lineHeight: 19, marginTop: 4 },
  signOut: { alignSelf: "flex-start", marginTop: 30, paddingVertical: 10 },
  signOutText: { color: "#A99EB2", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
});
