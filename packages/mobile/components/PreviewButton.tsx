import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { trackPlay } from "../lib/api";

interface PreviewButtonProps {
  uri: string;
  beatId: string;
  size?: number;
}

export function PreviewButton({ uri, beatId, size = 46 }: PreviewButtonProps) {
  const player = useAudioPlayer(uri, { updateInterval: 500, downloadFirst: false });
  const status = useAudioPlayerStatus(player);
  const tracked = useRef(false);

  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [player]);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    if (status.playing) {
      player.pause();
      return;
    }
    if (!tracked.current) {
      tracked.current = true;
      trackPlay(beatId).catch(() => undefined);
    }
    player.play();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={status.playing ? "Pause preview" : "Play preview"}
      onPress={toggle}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View style={styles.ring}>
        <Ionicons name={status.playing ? "pause" : "play"} size={size * 0.42} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A855F7",
    shadowColor: "#A855F7",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  ring: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 999,
  },
});
