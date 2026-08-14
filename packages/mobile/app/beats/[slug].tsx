import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader } from "../../components/BrandHeader";
import { PreviewButton } from "../../components/PreviewButton";
import { fetchBeat } from "../../lib/api";
import { useCart } from "../../lib/cart";
import { LICENSE_TIERS, formatPrice } from "../../lib/models";
import { font, vb } from "../../lib/theme";

export default function BeatDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { add } = useCart();
  const query = useQuery({ queryKey: ["beat", slug], queryFn: () => fetchBeat(slug) });
  if (query.isLoading) return <View style={styles.center}><ActivityIndicator color="#A855F7" /></View>;
  if (query.isError || !query.data) return <View style={styles.center}><Text style={styles.error}>This beat is unavailable.</Text></View>;
  const beat = query.data;
  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrandHeader eyebrow="LICENSE A BEAT" />
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}><Text style={styles.back}>‹ BACK TO CATALOG</Text></Pressable>
        <Image source={{ uri: beat.artworkUrl }} style={styles.art} />
        <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.title}>{beat.title}</Text><Text style={styles.meta}>{beat.genre} · {beat.bpm} BPM · {beat.musicalKey}</Text></View><PreviewButton uri={beat.audioUrl} beatId={beat.id} size={54} /></View>
        <Text style={styles.section}>Choose your rights</Text>
        {LICENSE_TIERS.filter((tier) => tier.id !== "exclusive" || !beat.soldExclusive).map((tier) => <Pressable key={tier.id} style={styles.tier} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); add(beat, tier.id); router.push("/(tabs)/cart"); }}><View style={{ flex: 1 }}><Text style={styles.tierName}>{tier.name}</Text><Text style={styles.desc}>{tier.description}</Text></View><View><Text style={styles.price}>{formatPrice(tier.priceCents)}</Text><Text style={styles.add}>ADD</Text></View></Pressable>)}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ page:{flex:1,backgroundColor:vb.black},content:{padding:20,paddingBottom:48},center:{flex:1,backgroundColor:vb.black,alignItems:"center",justifyContent:"center"},error:{color:vb.silverBright,fontFamily:font.body},backButton:{marginTop:22,alignSelf:"flex-start"},back:{color:vb.purpleBright,fontFamily:font.bodyBold,fontSize:11,letterSpacing:1},art:{width:"100%",aspectRatio:1,borderRadius:10,marginTop:16,backgroundColor:vb.ink2},row:{flexDirection:"row",gap:14,alignItems:"center",marginTop:18},title:{color:vb.silverBright,fontFamily:font.display,fontSize:32,letterSpacing:.35},meta:{color:vb.muted,fontFamily:font.bodyMedium,fontSize:13,marginTop:5},section:{color:vb.silverBright,fontFamily:font.display,fontSize:27,letterSpacing:.3,marginTop:30,marginBottom:12},tier:{flexDirection:"row",gap:12,backgroundColor:vb.ink,borderRadius:10,padding:15,borderWidth:1,borderColor:vb.border,marginBottom:9},tierName:{color:vb.silverBright,fontFamily:font.display,fontSize:20,letterSpacing:.2},desc:{color:vb.silver,fontFamily:font.body,fontSize:13,lineHeight:17,marginTop:4},price:{color:vb.silverBright,fontFamily:font.display,fontSize:21,textAlign:"right"},add:{color:vb.purpleBright,fontFamily:font.bodyBold,fontSize:10,letterSpacing:.8,marginTop:9,textAlign:"right"}});
