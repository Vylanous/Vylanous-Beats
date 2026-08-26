import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BrandHeader } from "../../components/BrandHeader";
import { ChromeText } from "../../components/ChromeText";
import { ScreenCanvas } from "../../components/ScreenCanvas";
import { PreviewButton } from "../../components/PreviewButton";
import { fetchBeat } from "../../lib/api";
import { useCart } from "../../lib/cart";
import { LICENSE_TIERS, formatPrice } from "../../lib/models";
import { font, vb } from "../../lib/theme";

export default function BeatDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { add } = useCart();
  const query = useQuery({ queryKey: ["beat", slug], queryFn: () => fetchBeat(slug) });
  if (query.isLoading)
    return (
      <ScreenCanvas contentStyle={styles.center}>
        <ActivityIndicator color={vb.purpleBright} />
      </ScreenCanvas>
    );
  if (query.isError || !query.data)
    return (
      <ScreenCanvas contentStyle={styles.center}>
        <Text style={styles.error}>This beat is unavailable.</Text>
      </ScreenCanvas>
    );
  const beat = query.data;
  return (
    <ScreenCanvas>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrandHeader eyebrow="LICENSE A BEAT" />
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
          <Text style={styles.back}>‹ BACK TO CATALOG</Text>
        </Pressable>
        <Image source={{ uri: beat.artworkUrl }} style={styles.art} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ChromeText style={styles.title}>{beat.title}</ChromeText>
            <Text style={styles.meta}>
              {beat.genre} · {beat.bpm} BPM · {beat.musicalKey}
            </Text>
          </View>
          <PreviewButton uri={beat.audioUrl} beatId={beat.id} size={54} />
        </View>
        <ChromeText style={styles.section}>CHOOSE YOUR RIGHTS</ChromeText>
        {LICENSE_TIERS.filter((tier) => tier.id !== "exclusive" || !beat.soldExclusive).map(
          (tier) => (
            <Pressable
              key={tier.id}
              style={styles.tier}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                add(beat, tier.id);
                router.push("/(tabs)/cart");
              }}
            >
              <View style={{ flex: 1 }}>
                <ChromeText style={styles.tierName}>{tier.name}</ChromeText>
                <Text style={styles.desc}>{tier.description}</Text>
              </View>
              <View>
                <ChromeText style={styles.price}>{formatPrice(tier.priceCents)}</ChromeText>
                <Text style={styles.add}>ADD</Text>
              </View>
            </Pressable>
          ),
        )}
      </ScrollView>
    </ScreenCanvas>
  );
}
const styles = StyleSheet.create({
  content: { padding: 22, paddingTop: 18, paddingBottom: 130 },
  center: { alignItems: "center", justifyContent: "center" },
  error: { color: vb.silverBright, fontFamily: font.body },
  backButton: { marginTop: 22, alignSelf: "flex-start" },
  back: { color: vb.purpleBright, fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 1 },
  art: { width: "100%", aspectRatio: 1, borderRadius: 10, marginTop: 16, backgroundColor: vb.ink2 },
  row: { flexDirection: "row", gap: 14, alignItems: "center", marginTop: 18 },
  title: { fontFamily: font.display, fontSize: 32, letterSpacing: 0.35 },
  meta: { color: vb.muted, fontFamily: font.bodyMedium, fontSize: 13, marginTop: 5 },
  section: {
    fontFamily: font.display,
    fontSize: 27,
    letterSpacing: 0.3,
    marginTop: 30,
    marginBottom: 12,
  },
  tier: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: vb.ink,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: vb.border,
    marginBottom: 9,
  },
  tierName: { fontFamily: font.display, fontSize: 20, letterSpacing: 0.2 },
  desc: { color: vb.silver, fontFamily: font.body, fontSize: 13, lineHeight: 17, marginTop: 4 },
  price: { fontFamily: font.display, fontSize: 21, textAlign: "right" },
  add: {
    color: vb.purpleBright,
    fontFamily: font.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    marginTop: 9,
    textAlign: "right",
  },
});
