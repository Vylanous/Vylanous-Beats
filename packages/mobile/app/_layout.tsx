import { Anton_400Regular } from "@expo-google-fonts/anton";
import { BarlowSemiCondensed_400Regular, BarlowSemiCondensed_500Medium, BarlowSemiCondensed_600SemiBold, BarlowSemiCondensed_700Bold } from "@expo-google-fonts/barlow-semi-condensed";
import { LeagueGothic_400Regular } from "@expo-google-fonts/league-gothic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { CartProvider } from "../lib/cart";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 2 } } });

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Anton_400Regular, LeagueGothic_400Regular, BarlowSemiCondensed_400Regular, BarlowSemiCondensed_500Medium, BarlowSemiCondensed_600SemiBold, BarlowSemiCondensed_700Bold });
  if (!fontsLoaded) return null;
  return <ErrorBoundary><SafeAreaProvider><QueryClientProvider client={queryClient}><CartProvider><StatusBar style="light"/><Stack screenOptions={{headerShown:false,animation:"fade"}}><Stack.Screen name="(tabs)"/><Stack.Screen name="beats/[slug]" options={{animation:"slide_from_right"}}/><Stack.Screen name="checkout" options={{presentation:"modal",animation:"slide_from_bottom"}}/></Stack></CartProvider></QueryClientProvider></SafeAreaProvider></ErrorBoundary>;
}
