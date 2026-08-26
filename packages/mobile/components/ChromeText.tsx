import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { useMobileAppSettings } from "../lib/app-settings";

type ChromeTextProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

/**
 * Native equivalent of the website's `text-chrome` utility.
 * It keeps the supplied Anton display sizing while filling block headers with
 * the same silver/chrome gradient used on vylanous.com.
 */
export function ChromeText({ children, style, numberOfLines }: ChromeTextProps) {
  const { visual } = useMobileAppSettings();
  const resolvedStyle = StyleSheet.flatten(style);

  if (!visual.chromeHeaders) {
    return (
      <Text
        numberOfLines={numberOfLines}
        style={[style, resolvedStyle?.color ? null : styles.plainText]}
      >
        {children}
      </Text>
    );
  }

  return (
    <MaskedView
      androidRenderingMode="software"
      style={styles.mask}
      maskElement={
        <Text numberOfLines={numberOfLines} style={[resolvedStyle, styles.maskText]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={["#FFFFFF", "#C9CCD6", "#8C8F9C", "#EDEEF2"]}
        locations={[0, 0.45, 0.6, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <Text numberOfLines={numberOfLines} style={[resolvedStyle, styles.sizingText]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  mask: { alignSelf: "flex-start" },
  maskText: { backgroundColor: "transparent", color: "#000000" },
  sizingText: { opacity: 0 },
  plainText: { color: "#EDEEF2" },
});
