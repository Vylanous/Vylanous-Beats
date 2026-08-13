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
const styles = StyleSheet.create({ page:{flex:1,backgroundColor:"#0B0A11"},content:{padding:20,paddingBottom:48},center:{flex:1,backgroundColor:"#0B0A11",alignItems:"center",justifyContent:"center"},error:{color:"#fff"},backButton:{marginTop:22,alignSelf:"flex-start"},back:{color:"#CDA8FF",fontWeight:"900",fontSize:11,letterSpacing:1},art:{width:"100%",aspectRatio:1,borderRadius:22,marginTop:16,backgroundColor:"#17141F"},row:{flexDirection:"row",gap:14,alignItems:"center",marginTop:18},title:{color:"#F8F6FB",fontSize:27,fontWeight:"900"},meta:{color:"#ABA6B5",fontSize:13,marginTop:5},section:{color:"#F8F6FB",fontSize:21,fontWeight:"900",marginTop:30,marginBottom:12},tier:{flexDirection:"row",gap:12,backgroundColor:"#17141F",borderRadius:16,padding:15,borderWidth:1,borderColor:"rgba(255,255,255,.08)",marginBottom:9},tierName:{color:"#F8F6FB",fontSize:15,fontWeight:"800"},desc:{color:"#9E98A8",fontSize:11,lineHeight:16,marginTop:4},price:{color:"#E9D9FF",fontSize:15,fontWeight:"900",textAlign:"right"},add:{color:"#CDA8FF",fontSize:10,fontWeight:"900",letterSpacing:.8,marginTop:9,textAlign:"right"}});
