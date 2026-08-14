import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCustomer } from "../../lib/customer";

export default function LibraryScreen() {
  const { customer, dashboard } = useCustomer();
  if (!customer)
    return (
      <View style={s.page}>
        <Text style={s.eyebrow}>YOUR MUSIC</Text>
        <Text style={s.title}>License library</Text>
        <Text style={s.copy}>
          Sign in to see every license and secure download in your account.
        </Text>
        <Pressable style={s.button} onPress={() => router.push("/login")}>
          <Text style={s.buttonText}>SIGN IN</Text>
        </Pressable>
      </View>
    );
  return (
    <View style={s.page}>
      <Text style={s.eyebrow}>YOUR MUSIC</Text>
      <Text style={s.title}>License library</Text>
      <Text style={s.copy}>
        {dashboard?.insights.licensesOwned ?? 0} active license
        {dashboard?.insights.licensesOwned === 1 ? "" : "s"} are available in your account.
      </Text>
      <Pressable style={s.button} onPress={() => router.push("/(tabs)/profile")}>
        <Text style={s.buttonText}>OPEN MUSIC VAULT</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0A11", padding: 22, paddingTop: 22 },
  eyebrow: { color: "#B982FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#F8F6FB", fontSize: 30, fontWeight: "900", marginTop: 6 },
  copy: { color: "#ABA6B5", fontSize: 13, lineHeight: 20, marginTop: 18 },
  button: {
    backgroundColor: "#A855F7",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 11, letterSpacing: 0.8 },
});
