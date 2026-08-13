import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Beat } from "../lib/models";
import { formatPrice } from "../lib/models";
import { PreviewButton } from "./PreviewButton";

export function BeatCard({ beat, compact = false }: { beat: Beat; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${beat.title}`}
      onPress={() => router.push(`/beats/${beat.slug}`)}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <Image source={{ uri: beat.artworkUrl }} style={[styles.artwork, compact && styles.artworkCompact]} />
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.title}>
            {beat.title}
          </Text>
          {beat.featured ? <View style={styles.featured}><Text style={styles.featuredText}>FEATURED</Text></View> : null}
        </View>
        <Text numberOfLines={1} style={styles.subline}>
          {beat.genre} · {beat.bpm} BPM · {beat.musicalKey || "Key TBA"}
        </Text>
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.priceLabel}>LICENSE FROM</Text>
            <Text style={styles.price}>{formatPrice(beat.priceFrom)}</Text>
          </View>
          <PreviewButton uri={beat.audioUrl} beatId={beat.id} size={42} />
        </View>
      </View>
      <Ionicons name="chevron-forward" color="#77727F" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 13,
    backgroundColor: "#16141D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 18,
    padding: 10,
    alignItems: "center",
  },
  cardCompact: { width: 282, flexDirection: "column", alignItems: "stretch" },
  artwork: { width: 86, height: 86, borderRadius: 12, backgroundColor: "#292630" },
  artworkCompact: { width: "100%", height: 178, borderRadius: 12 },
  content: { flex: 1, minWidth: 0, justifyContent: "space-between", alignSelf: "stretch", paddingVertical: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#F9F7FC", fontSize: 15, fontWeight: "800", flex: 1 },
  featured: { backgroundColor: "rgba(168,85,247,0.16)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 },
  featuredText: { color: "#D8B4FE", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  subline: { color: "#A39EAC", fontSize: 11, marginTop: 4 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  priceLabel: { color: "#77727F", fontSize: 8, fontWeight: "800", letterSpacing: 0.7 },
  price: { color: "#E7D8FF", fontSize: 15, fontWeight: "900", marginTop: 1 },
});
