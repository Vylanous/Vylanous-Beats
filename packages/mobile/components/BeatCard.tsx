import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Beat } from "../lib/models";
import { formatPrice } from "../lib/models";
import { font, vb } from "../lib/theme";
import { ChromeText } from "./ChromeText";
import { PreviewButton } from "./PreviewButton";
export function BeatCard({ beat, compact = false }: { beat: Beat; compact?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(`/beats/${beat.slug}`)}
      style={[s.card, compact && s.compact]}
    >
      <Image source={{ uri: beat.artworkUrl }} style={[s.art, compact && s.artCompact]} />
      <View style={s.content}>
        <View style={s.metaRow}>
          <ChromeText numberOfLines={1} style={s.title}>
            {beat.title}
          </ChromeText>
          {beat.featured ? (
            <View style={s.featured}>
              <Text style={s.featuredText}>FEATURED</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={s.sub}>
          {beat.genre} · {beat.bpm} BPM · {beat.musicalKey || "KEY TBA"}
        </Text>
        <View style={s.bottom}>
          <View>
            <Text style={s.label}>LICENSE FROM</Text>
            <ChromeText style={s.price}>{formatPrice(beat.priceFrom)}</ChromeText>
          </View>
          <PreviewButton uri={beat.audioUrl} beatId={beat.id} size={42} />
        </View>
      </View>
      <Ionicons name="chevron-forward" color={vb.muted} size={18} />
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 13,
    backgroundColor: vb.ink,
    borderWidth: 1,
    borderColor: vb.border,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  compact: { width: 282, flexDirection: "column", alignItems: "stretch" },
  art: { width: 86, height: 86, borderRadius: 6, backgroundColor: vb.ink2 },
  artCompact: { width: "100%", height: 178, borderRadius: 6 },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: 2,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    fontFamily: font.display,
    fontSize: 21,
    letterSpacing: 0.25,
    flex: 1,
  },
  featured: {
    backgroundColor: "rgba(124,47,203,.18)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  featuredText: {
    color: vb.purpleBright,
    fontFamily: font.sub,
    fontSize: 14,
    lineHeight: 15,
    letterSpacing: 0.6,
  },
  sub: { color: vb.muted, fontFamily: font.bodyMedium, fontSize: 12, marginTop: 4 },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: { color: vb.muted, fontFamily: font.sub, fontSize: 14, lineHeight: 15, letterSpacing: 0.6 },
  price: { fontFamily: font.display, fontSize: 21, marginTop: 1 },
});
