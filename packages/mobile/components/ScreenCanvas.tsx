import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { vb } from "../lib/theme";

type ScreenCanvasProps = {
  children?: ReactNode;
  safeEdges?: ("top" | "bottom" | "left" | "right")[];
  contentStyle?: object;
};

/**
 * Native equivalent of the website's `bg-mesh` utility. The gradients are
 * decorative only; content sits above them within a device-safe canvas.
 */
export function ScreenCanvas({
  children,
  safeEdges = ["top"],
  contentStyle,
}: ScreenCanvasProps) {
  return (
    <View style={s.canvas}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(124,47,203,0.28)", "rgba(124,47,203,0)"]}
        start={{ x: 0.84, y: 0 }}
        end={{ x: 0.36, y: 0.56 }}
        style={[s.glow, s.topRightGlow]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(74,20,128,0.38)", "rgba(74,20,128,0)"]}
        start={{ x: 0.06, y: 0.08 }}
        end={{ x: 0.62, y: 0.76 }}
        style={[s.glow, s.topLeftGlow]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(124,47,203,0.2)", "rgba(124,47,203,0)"]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.3 }}
        style={[s.glow, s.bottomGlow]}
      />
      <SafeAreaView edges={safeEdges} style={[s.safeArea, contentStyle]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  canvas: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: vb.black,
  },
  safeArea: {
    flex: 1,
  },
  glow: {
    position: "absolute",
  },
  topRightGlow: {
    width: "120%",
    height: "58%",
    right: "-30%",
    top: "-16%",
  },
  topLeftGlow: {
    width: "108%",
    height: "62%",
    left: "-40%",
    top: "3%",
  },
  bottomGlow: {
    width: "125%",
    height: "54%",
    left: "-12%",
    bottom: "-28%",
  },
});
