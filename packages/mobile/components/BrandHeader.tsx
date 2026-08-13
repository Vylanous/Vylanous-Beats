import { Image, StyleSheet, Text, View } from "react-native";

export function BrandHeader({ eyebrow }: { eyebrow?: string }) {
  return (
    <View style={styles.wrap}>
      <Image source={require("../assets/icon.png")} style={styles.mark} />
      <View>
        <Text style={styles.wordmark}>VYLANOUS</Text>
        <Text style={styles.submark}>{eyebrow ?? "BEATS"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 9 },
  mark: { width: 36, height: 36, borderRadius: 10 },
  wordmark: { color: "#F8F6FB", fontSize: 15, fontWeight: "900", letterSpacing: 1.6 },
  submark: { color: "#B982FF", fontSize: 8, fontWeight: "900", letterSpacing: 2.4, marginTop: 2 },
});
