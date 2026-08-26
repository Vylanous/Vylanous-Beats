import { Image, StyleSheet, Text, View } from "react-native";
import { ChromeText } from "./ChromeText";
import { font, vb } from "../lib/theme";

export function BrandHeader({ eyebrow }: { eyebrow?: string }) {
  return (
    <View style={styles.wrap}>
      <Image source={require("../assets/icon.png")} style={styles.mark} />
      <View>
        <ChromeText style={styles.wordmark}>VYLANOUS</ChromeText>
        <Text style={styles.submark}>{eyebrow ?? "BEATS"}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 9 },
  mark: { width: 36, height: 36, borderRadius: 10 },
  wordmark: {
    fontFamily: font.display,
    fontSize: 19,
    letterSpacing: 0.7,
    lineHeight: 20,
  },
  submark: {
    color: vb.purpleBright,
    fontFamily: font.sub,
    fontSize: 15,
    lineHeight: 16,
    letterSpacing: 1.5,
    marginTop: 1,
  },
});
