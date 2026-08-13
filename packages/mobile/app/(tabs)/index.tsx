import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchFeaturedBeats } from "../../lib/api";
import { BeatCard } from "../../components/BeatCard";

export default function HomeScreen() {
  const featured = useQuery({ queryKey: ["featured-beats"], queryFn: fetchFeaturedBeats });
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>VYLANOUS BEATS</Text>
      <Text style={styles.title}>Beats that{`\n`}hit different.</Text>
      <Text style={styles.copy}>Premium hip-hop production, studio-ready licensing, and instant delivery for independent artists.</Text>
      <Pressable style={styles.primary} onPress={() => router.push("/(tabs)/beats")}><Text style={styles.primaryText}>BROWSE THE CATALOG</Text></Pressable>
      <View style={styles.sectionHead}><View><Text style={styles.eyebrow}>HAND-PICKED</Text><Text style={styles.sectionTitle}>Featured drops</Text></View><Pressable onPress={() => router.push("/(tabs)/beats")}><Text style={styles.link}>VIEW ALL</Text></Pressable></View>
      {featured.isLoading ? <ActivityIndicator color="#A855F7" style={styles.loader} /> : featured.isError ? <Text style={styles.muted}>Featured beats are unavailable. Pull down in the catalog to retry.</Text> : <FlatList horizontal data={featured.data ?? []} renderItem={({ item }) => <BeatCard beat={item} compact />} keyExtractor={(item) => item.id} contentContainerStyle={styles.rail} showsHorizontalScrollIndicator={false} />}
      <View style={styles.promise}><Text style={styles.promiseTitle}>Built for release day.</Text><Text style={styles.promiseText}>Preview every beat, choose the license that fits your release, and receive your files instantly after purchase.</Text></View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({ page:{flex:1,backgroundColor:"#0B0A11"},content:{padding:22,paddingBottom:40},eyebrow:{color:"#B982FF",fontSize:10,fontWeight:"900",letterSpacing:1.5},title:{color:"#F8F6FB",fontSize:39,lineHeight:42,fontWeight:"900",letterSpacing:-1.4,marginTop:10},copy:{color:"#ABA6B5",fontSize:15,lineHeight:23,marginTop:14,maxWidth:340},primary:{backgroundColor:"#A855F7",borderRadius:14,alignItems:"center",paddingVertical:16,marginTop:23},primaryText:{color:"#FFF",fontWeight:"900",fontSize:12,letterSpacing:1},sectionHead:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:38},sectionTitle:{color:"#F8F6FB",fontSize:25,fontWeight:"900",marginTop:5},link:{color:"#CDA8FF",fontSize:11,fontWeight:"900",letterSpacing:.7},rail:{gap:12,paddingVertical:16},loader:{marginVertical:42},muted:{color:"#9892A1",marginVertical:22},promise:{backgroundColor:"#17141F",borderWidth:1,borderColor:"rgba(255,255,255,0.07)",borderRadius:18,padding:20,marginTop:12},promiseTitle:{color:"#F8F6FB",fontWeight:"900",fontSize:18},promiseText:{color:"#A9A4B0",lineHeight:21,fontSize:13,marginTop:8}});
