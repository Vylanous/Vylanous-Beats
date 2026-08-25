import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BeatCard } from "../../components/BeatCard";
import { BrandHeader } from "../../components/BrandHeader";
import { ScreenCanvas } from "../../components/ScreenCanvas";
import { fetchFeaturedBeats } from "../../lib/api";
import { font, vb } from "../../lib/theme";
export default function HomeScreen() {
  const featured = useQuery({ queryKey: ["featured-beats"], queryFn: fetchFeaturedBeats });
  return (
    <ScreenCanvas>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <BrandHeader />
        <Text style={s.eyebrow}>PREMIUM HIP-HOP BEATS</Text>
        <Text style={s.title}>BEATS THAT{`\n`}HIT DIFFERENT.</Text>
        <Text style={s.copy}>
          Rhythmic expression, melodious compositions, and street-ready energy for artists who want
          to stand out.
        </Text>
        <Pressable style={s.primary} onPress={() => router.push("/(tabs)/beats")}>
          <Text style={s.primaryText}>BROWSE BEATS</Text>
        </Pressable>
        <View style={s.sectionHead}>
          <View>
            <Text style={s.eyebrow}>HAND-PICKED</Text>
            <Text style={s.sectionTitle}>FEATURED BEATS</Text>
          </View>
          <Pressable onPress={() => router.push("/(tabs)/beats")}>
            <Text style={s.link}>ALL BEATS →</Text>
          </Pressable>
        </View>
        {featured.isLoading ? (
          <ActivityIndicator color={vb.purpleBright} style={s.loader} />
        ) : featured.isError ? (
          <Text style={s.muted}>
            Featured beats are unavailable. Pull down in the catalog to retry.
          </Text>
        ) : (
          <FlatList
            horizontal
            data={featured.data ?? []}
            renderItem={({ item }) => <BeatCard beat={item} compact />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.rail}
            showsHorizontalScrollIndicator={false}
          />
        )}
        <View style={s.promise}>
          <Text style={s.promiseTitle}>STUDIO QUALITY. INSTANT DELIVERY.</Text>
          <Text style={s.promiseText}>
            Preview every beat, choose the license that fits your release, and receive your files by
            email after confirmation.
          </Text>
        </View>
      </ScrollView>
    </ScreenCanvas>
  );
}
const s = StyleSheet.create({
  content: { padding: 22, paddingBottom: 40 },
  eyebrow: {
    color: vb.purpleBright,
    fontFamily: font.bodyBold,
    fontSize: 10,
    letterSpacing: 1.6,
    marginTop: 24,
  },
  title: {
    color: vb.silverBright,
    fontFamily: font.display,
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  copy: {
    color: vb.silver,
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 340,
  },
  primary: {
    backgroundColor: vb.purple,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 23,
    shadowColor: vb.purple,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  primaryText: { color: vb.white, fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 38,
  },
  sectionTitle: {
    color: vb.silverBright,
    fontFamily: font.display,
    fontSize: 28,
    letterSpacing: 0.3,
    marginTop: 3,
  },
  link: { color: vb.purpleBright, fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 0.7 },
  rail: { gap: 12, paddingVertical: 16 },
  loader: { marginVertical: 42 },
  muted: { color: vb.muted, fontFamily: font.body, marginVertical: 22 },
  promise: {
    backgroundColor: vb.ink,
    borderWidth: 1,
    borderColor: vb.border,
    borderRadius: 10,
    padding: 20,
    marginTop: 12,
  },
  promiseTitle: {
    color: vb.silverBright,
    fontFamily: font.display,
    fontSize: 20,
    letterSpacing: 0.2,
  },
  promiseText: {
    color: vb.silver,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});
