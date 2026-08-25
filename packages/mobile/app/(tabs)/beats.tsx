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
import { BeatCard } from "../../components/BeatCard";
import { BrandHeader } from "../../components/BrandHeader";
import { ScreenCanvas } from "../../components/ScreenCanvas";
import { fetchBeats, fetchFeaturedBeats } from "../../lib/api";
import { useCustomer } from "../../lib/customer";
import { font, radius, type, vb } from "../../lib/theme";

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
    <ScreenCanvas>
      <View style={s.header}>
        <BrandHeader eyebrow={customer ? "BEAT CATALOG" : "FEATURED BEATS"} />
        <Text style={s.title}>{customer ? "FIND YOUR SOUND" : "FEATURED SOUNDS"}</Text>
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
          placeholderTextColor={vb.muted}
          style={s.search}
        />
      </View>
      {query.isLoading ? (
        <ActivityIndicator color={vb.purpleBright} style={s.loader} />
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
              tintColor={vb.purpleBright}
            />
          }
          ListEmptyComponent={<Text style={s.empty}>No beats match that search.</Text>}
        />
      )}
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 18 },
  title: { ...type.pageTitle, color: vb.silverBright, marginTop: 20 },
  copy: { ...type.body, color: vb.silver, marginTop: 7 },
  gate: {
    backgroundColor: "rgba(74,20,128,0.3)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(162,77,245,0.55)",
    padding: 15,
    marginTop: 16,
    shadowColor: vb.purple,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  gateTitle: { ...type.eyebrow, color: vb.silverBright },
  gateBody: { ...type.body, color: vb.silver, fontSize: 14, lineHeight: 19, marginTop: 7 },
  gateButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(162,77,245,0.75)",
    borderRadius: radius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 13,
  },
  gateButtonText: { ...type.button, color: vb.purpleBright, fontSize: 10 },
  search: {
    backgroundColor: "rgba(19,19,24,0.94)",
    borderWidth: 1,
    borderColor: vb.input,
    color: vb.silverBright,
    borderRadius: radius.card,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginTop: 18,
    fontFamily: font.body,
    fontSize: 16,
  },
  list: { padding: 22, paddingTop: 14, paddingBottom: 126 },
  loader: { marginTop: 40 },
  empty: { ...type.body, color: vb.silver, textAlign: "center", marginTop: 50 },
});
