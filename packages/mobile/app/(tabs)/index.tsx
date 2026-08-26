import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BeatCard } from "../../components/BeatCard";
import { BrandHeader } from "../../components/BrandHeader";
import { ChromeText } from "../../components/ChromeText";
import { ScreenCanvas } from "../../components/ScreenCanvas";
import { fetchFeaturedBeats } from "../../lib/api";
import {
  mobileDensityPadding,
  useMobileAppSettings,
  type MobileActionId,
} from "../../lib/app-settings";
import { font, type, vb } from "../../lib/theme";

export default function HomeScreen() {
  const featured = useQuery({ queryKey: ["featured-beats"], queryFn: fetchFeaturedBeats });
  const app = useMobileAppSettings();
  const { home } = app;
  const horizontalPadding = mobileDensityPadding(app.visual.contentDensity);

  const openAction = (requestedAction: MobileActionId) => {
    const tab = app.navigation.tabs.find((candidate) => candidate.id === requestedAction);
    const featureAvailable =
      (requestedAction !== "library" || app.features.customerLibrary) &&
      (requestedAction !== "account" || app.features.customerAccount);
    const action = tab?.visible && featureAvailable ? requestedAction : "beats";
    const routes: Record<MobileActionId, "/(tabs)/beats" | "/(tabs)/cart" | "/(tabs)/library" | "/(tabs)/profile"> = {
      beats: "/(tabs)/beats",
      cart: "/(tabs)/cart",
      library: "/(tabs)/library",
      account: "/(tabs)/profile",
    };
    router.push(routes[action]);
  };

  return (
    <ScreenCanvas>
      <ScrollView
        contentContainerStyle={[s.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {home.showBrandHeader && <BrandHeader />}
        {home.sectionOrder.map((section) => {
          if (section === "hero") {
            return (
              <View key="hero">
                <Text style={s.eyebrow}>{home.heroEyebrow.toUpperCase()}</Text>
                <ChromeText style={s.title}>{home.heroTitle.toUpperCase()}</ChromeText>
                <Text style={s.copy}>{home.heroBody}</Text>
                <Pressable style={s.primary} onPress={() => openAction(home.primaryCtaAction)}>
                  <Text style={s.primaryText}>{home.primaryCtaLabel.toUpperCase()}</Text>
                </Pressable>
              </View>
            );
          }

          if (section === "featured" && home.showFeatured) {
            return (
              <View key="featured">
                <View style={s.sectionHead}>
                  <View>
                    <Text style={s.eyebrow}>{home.featuredEyebrow.toUpperCase()}</Text>
                    <ChromeText style={s.sectionTitle}>{home.featuredTitle.toUpperCase()}</ChromeText>
                  </View>
                  <Pressable onPress={() => openAction("beats")}>
                    <Text style={s.link}>ALL BEATS →</Text>
                  </Pressable>
                </View>
                {featured.isLoading ? (
                  <ActivityIndicator color={vb.purpleBright} style={s.loader} />
                ) : featured.isError ? (
                  <Text style={s.muted}>
                    Featured beats are unavailable. Pull down in the catalog to retry.
                  </Text>
                ) : (
                  <FlatList
                    horizontal
                    data={featured.data ?? []}
                    renderItem={({ item }) => <BeatCard beat={item} compact />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={s.rail}
                    showsHorizontalScrollIndicator={false}
                  />
                )}
              </View>
            );
          }

          if (section === "promise" && home.showPromise) {
            return (
              <View key="promise" style={s.promise}>
                <ChromeText style={s.promiseTitle}>{home.promiseTitle.toUpperCase()}</ChromeText>
                <Text style={s.promiseText}>{home.promiseBody}</Text>
              </View>
            );
          }

          return null;
        })}
      </ScrollView>
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 0, paddingBottom: 40 },
  eyebrow: { ...type.eyebrow, color: vb.purpleBright, marginTop: 24 },
  title: { ...type.hero, marginTop: 8, maxWidth: 360 },
  copy: { ...type.body, color: vb.silver, marginTop: 14, maxWidth: 340 },
  primary: {
    backgroundColor: vb.purple,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 23,
    shadowColor: vb.purple,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  primaryText: { ...type.button, color: vb.white },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 38,
  },
  sectionTitle: { ...type.section, marginTop: 3 },
  link: { ...type.button, color: vb.purpleBright, fontSize: 11, letterSpacing: 0.7 },
  rail: { gap: 12, paddingVertical: 16 },
  loader: { marginVertical: 42 },
  muted: { ...type.body, color: vb.muted, fontSize: 14, lineHeight: 20, marginVertical: 22 },
  promise: {
    backgroundColor: vb.ink,
    borderWidth: 1,
    borderColor: vb.border,
    borderRadius: 10,
    padding: 20,
    marginTop: 12,
  },
  promiseTitle: { ...type.section, fontSize: 20, lineHeight: 23 },
  promiseText: { ...type.body, color: vb.silver, fontSize: 14, lineHeight: 20, marginTop: 8 },
});
