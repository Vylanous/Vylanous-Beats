import { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useCustomer } from "../lib/customer";

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
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp({ email, password, displayName, marketingOptIn });
      }
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
    <View style={s.page}>
      <Pressable style={s.backButton} onPress={() => router.back()}>
        <Text style={s.back}>‹ BACK</Text>
      </Pressable>
      <Text style={s.eyebrow}>VYL ANOUS BEATS</Text>
      <Text style={s.title}>{mode === "login" ? "Welcome back" : "Create your vault"}</Text>
      <Text style={s.copy}>
        Sign in to access the full catalog, complete purchases, and keep every license in one place.
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
          <Text style={[s.modeText, mode === "register" && s.modeTextActive]}>CREATE ACCOUNT</Text>
        </Pressable>
      </View>
      {mode === "register" && (
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          placeholder="Artist or display name"
          placeholderTextColor="#77727F"
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
        placeholderTextColor="#77727F"
        style={s.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholder="Password (10+ characters)"
        placeholderTextColor="#77727F"
        style={s.input}
      />
      {mode === "register" && (
        <View style={s.preference}>
          <View style={s.preferenceCopy}>
            <Text style={s.preferenceTitle}>Studio notes & early drops</Text>
            <Text style={s.preferenceBody}>
              Receive releases, useful updates, and occasional offers.
            </Text>
          </View>
          <Switch
            value={marketingOptIn}
            onValueChange={setMarketingOptIn}
            trackColor={{ false: "#40394A", true: "#7E22CE" }}
            thumbColor="#F8F6FB"
          />
        </View>
      )}
      <Pressable disabled={busy} style={[s.button, busy && s.disabled]} onPress={submit}>
        <Text style={s.buttonText}>
          {busy ? "WORKING…" : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0A11", padding: 22, paddingTop: 72 },
  backButton: { alignSelf: "flex-start" },
  back: { color: "#CDA8FF", fontWeight: "900", fontSize: 11 },
  eyebrow: { color: "#B982FF", fontWeight: "900", fontSize: 10, letterSpacing: 1.5, marginTop: 48 },
  title: { color: "#F8F6FB", fontSize: 34, fontWeight: "900", marginTop: 8 },
  copy: { color: "#ABA6B5", fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 340 },
  switcher: {
    flexDirection: "row",
    backgroundColor: "#17141F",
    borderRadius: 12,
    padding: 4,
    marginTop: 28,
    marginBottom: 10,
  },
  mode: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 9 },
  modeActive: { backgroundColor: "#2A2035" },
  modeText: { color: "#817B8B", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  modeTextActive: { color: "#E7D8FF" },
  input: {
    backgroundColor: "#17141F",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    color: "#F8F6FB",
    padding: 15,
    marginTop: 12,
  },
  preference: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17141F",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  preferenceCopy: { flex: 1 },
  preferenceTitle: { color: "#F8F6FB", fontWeight: "800", fontSize: 13 },
  preferenceBody: { color: "#817B8B", fontSize: 11, lineHeight: 16, marginTop: 3 },
  button: {
    backgroundColor: "#A855F7",
    borderRadius: 14,
    alignItems: "center",
    padding: 16,
    marginTop: 20,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "white", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
});
