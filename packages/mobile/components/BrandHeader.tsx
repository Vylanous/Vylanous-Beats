import { Image, StyleSheet, Text, View } from "react-native";
import { font, vb } from "../lib/theme";

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
  wordmark: {
    color: vb.silverBright,
    fontFamily: font.display,
    fontSize: 19,
    letterSpacing: 0.7,
    lineHeight: 20,
  },
  submark: {
    color: vb.purpleBright,
    fontFamily: font.bodyBold,
    fontSize: 9,
    letterSpacing: 2.5,
    marginTop: 1,
  },
});
