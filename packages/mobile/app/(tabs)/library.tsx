import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BrandHeader } from "../../components/BrandHeader";
import { ChromeText } from "../../components/ChromeText";
import { ScreenCanvas } from "../../components/ScreenCanvas";
import { font, radius, type, vb } from "../../lib/theme";
import { useCustomer } from "../../lib/customer";

export default function LibraryScreen() {
  const { customer, dashboard } = useCustomer();
  const signedIn = Boolean(customer);

  return (
    <ScreenCanvas>
      <View style={s.content}>
        <BrandHeader eyebrow="YOUR MUSIC" />
        <ChromeText style={s.title}>LICENSE LIBRARY</ChromeText>
        <Text style={s.copy}>
          {signedIn
            ? `${dashboard?.insights.licensesOwned ?? 0} active license${
                dashboard?.insights.licensesOwned === 1 ? " is" : "s are"
              } available in your account.`
            : "Sign in to see every license and secure download in your account."}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={s.button}
          onPress={() => router.push(signedIn ? "/(tabs)/profile" : "/login")}
        >
          <Text style={s.buttonText}>{signedIn ? "OPEN MUSIC VAULT" : "SIGN IN"}</Text>
        </Pressable>
      </View>
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  title: {
    ...type.pageTitle,
    marginTop: 20,
  },
  copy: {
    ...type.body,
    color: vb.silver,
    marginTop: 14,
    maxWidth: 330,
  },
  button: {
    alignSelf: "flex-start",
    marginTop: 24,
    borderRadius: radius.card,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: vb.purple,
    borderWidth: 1,
    borderColor: "rgba(162,77,245,0.74)",
    shadowColor: vb.purpleBright,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  buttonText: {
    ...type.button,
    color: vb.white,
    fontFamily: font.bodyBold,
  },
});
