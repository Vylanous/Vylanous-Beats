import { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { BrandHeader } from "../components/BrandHeader";
import { ScreenCanvas } from "../components/ScreenCanvas";
import { useCustomer } from "../lib/customer";
import { font, vb } from "../lib/theme";
export default function LoginScreen() {
  const { signIn, signUp } = useCustomer();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp({ email, password, displayName, marketingOptIn });
      router.replace("/(tabs)/profile");
    } catch (error) {
      Alert.alert(
        mode === "login" ? "Could not sign in" : "Could not create account",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScreenCanvas>
      <View style={s.content}>
        <BrandHeader eyebrow="CUSTOMER PORTAL" />
        <Pressable style={s.backButton} onPress={() => router.back()}>
          <Text style={s.back}>‹ BACK</Text>
        </Pressable>
        <Text style={s.title}>{mode === "login" ? "WELCOME BACK" : "CREATE YOUR VAULT"}</Text>
        <Text style={s.copy}>
          Sign in to access your licenses, secure downloads, saved purchases, and account
          preferences.
        </Text>
        <View style={s.switcher}>
          <Pressable
            style={[s.mode, mode === "login" && s.modeActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[s.modeText, mode === "login" && s.modeTextActive]}>SIGN IN</Text>
          </Pressable>
          <Pressable
            style={[s.mode, mode === "register" && s.modeActive]}
            onPress={() => setMode("register")}
          >
            <Text style={[s.modeText, mode === "register" && s.modeTextActive]}>
              CREATE ACCOUNT
            </Text>
          </Pressable>
        </View>
        {mode === "register" && (
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholder="Artist or display name"
            placeholderTextColor={vb.muted}
            style={s.input}
          />
        )}
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email address"
          placeholderTextColor={vb.muted}
          style={s.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Password (10+ characters)"
          placeholderTextColor={vb.muted}
          style={s.input}
        />
        {mode === "register" && (
          <View style={s.preference}>
            <View style={s.preferenceCopy}>
              <Text style={s.preferenceTitle}>STUDIO NOTES & EARLY DROPS</Text>
              <Text style={s.preferenceBody}>
                Receive releases, useful updates, and occasional offers.
              </Text>
            </View>
            <Switch
              value={marketingOptIn}
              onValueChange={setMarketingOptIn}
              trackColor={{ false: vb.ink2, true: vb.purple }}
              thumbColor={vb.silverBright}
            />
          </View>
        )}
        <Pressable disabled={busy} style={[s.button, busy && s.disabled]} onPress={submit}>
          <Text style={s.buttonText}>
            {busy ? "WORKING…" : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </Text>
        </Pressable>
      </View>
    </ScreenCanvas>
  );
}
const s = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 18 },
  backButton: { alignSelf: "flex-start", marginTop: 22 },
  back: { color: vb.purpleBright, fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 1 },
  title: {
    color: vb.silverBright,
    fontFamily: font.display,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: 0.4,
    marginTop: 22,
  },
  copy: {
    color: vb.silver,
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 340,
  },
  switcher: {
    flexDirection: "row",
    backgroundColor: vb.ink,
    borderRadius: 10,
    padding: 4,
    marginTop: 28,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: vb.border,
  },
  mode: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 7 },
  modeActive: { backgroundColor: vb.ink2 },
  modeText: { color: vb.muted, fontFamily: font.bodyBold, fontSize: 10, letterSpacing: 0.7 },
  modeTextActive: { color: vb.silverBright },
  input: {
    backgroundColor: vb.ink,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vb.input,
    color: vb.silverBright,
    fontFamily: font.body,
    fontSize: 16,
    padding: 15,
    marginTop: 12,
  },
  preference: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: vb.ink,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vb.border,
    marginTop: 12,
    gap: 12,
  },
  preferenceCopy: { flex: 1 },
  preferenceTitle: {
    color: vb.silverBright,
    fontFamily: font.bodyBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  preferenceBody: {
    color: vb.muted,
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  button: {
    backgroundColor: vb.purple,
    borderRadius: 10,
    alignItems: "center",
    padding: 16,
    marginTop: 20,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: vb.white, fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1 },
});
