import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BeatCard } from "../../components/BeatCard";
import { BrandHeader } from "../../components/BrandHeader";
import { fetchBeats, fetchFeaturedBeats } from "../../lib/api";
import { useCustomer } from "../../lib/customer";

export default function BeatsScreen() {
  const { customer } = useCustomer();
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: [customer ? "customer-beats" : "featured-beats"],
    queryFn: customer ? fetchBeats : fetchFeaturedBeats,
  });
  const beats = useMemo(
    () =>
      (query.data ?? []).filter((beat) =>
        `${beat.title} ${beat.genre} ${beat.mood} ${beat.tags}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      ),
    [q, query.data],
  );

  return (
    <SafeAreaView style={s.page} edges={["top"]}>
      <View style={s.header}>
        <BrandHeader eyebrow={customer ? "BEAT CATALOG" : "FEATURED BEATS"} />
        <Text style={s.title}>{customer ? "Find your sound" : "Featured sounds"}</Text>
        <Text style={s.copy}>
          {customer
            ? "Live drops, ready for your next release."
            : "A public selection from the Vylanous vault. Sign in to unlock the full catalog."}
        </Text>
        {!customer && (
          <View style={s.gate}>
            <Text style={s.gateTitle}>UNLOCK THE FULL CATALOG</Text>
            <Text style={s.gateBody}>
              Create an account to browse every beat, purchase licenses, and keep downloads in one
              music vault.
            </Text>
            <Pressable style={s.gateButton} onPress={() => router.push("/login")}>
              <Text style={s.gateButtonText}>SIGN IN OR CREATE ACCOUNT</Text>
            </Pressable>
          </View>
        )}
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search beats, moods, or genres"
          placeholderTextColor="#77727F"
          style={s.search}
        />
      </View>
      {query.isLoading ? (
        <ActivityIndicator color="#A855F7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={beats}
          keyExtractor={(beat) => beat.id}
          renderItem={({ item }) => <BeatCard beat={item} />}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor="#A855F7"
            />
          }
          ListEmptyComponent={<Text style={s.empty}>No beats match that search.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0A11" },
  header: { paddingHorizontal: 18, paddingTop: 18 },
  title: { color: "#F8F6FB", fontSize: 30, fontWeight: "900", marginTop: 20 },
  copy: { color: "#A9A4B0", marginTop: 6, fontSize: 13, lineHeight: 18 },
  gate: {
    backgroundColor: "#17141F",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,.35)",
    padding: 15,
    marginTop: 16,
  },
  gateTitle: { color: "#DDBDFF", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  gateBody: { color: "#ABA6B5", fontSize: 12, lineHeight: 18, marginTop: 6 },
  gateButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#A855F7",
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginTop: 12,
  },
  gateButtonText: { color: "#DDBDFF", fontWeight: "900", fontSize: 9, letterSpacing: 0.5 },
  search: {
    backgroundColor: "#17141F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
    color: "#fff",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginTop: 18,
    fontSize: 14,
  },
  list: { padding: 18, paddingTop: 14, paddingBottom: 100 },
  empty: { color: "#A9A4B0", textAlign: "center", marginTop: 50 },
});
