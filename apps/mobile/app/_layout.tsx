import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from "@expo-google-fonts/geist";
import {
  GeistMono_400Regular,
  GeistMono_700Bold,
} from "@expo-google-fonts/geist-mono";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

import { useSession } from "@/lib/auth-client";
import { ThemeProvider as PaletteProvider } from "@/lib/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_700Bold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { data: session, isPending } = useSession();
  const segments = useSegments();
  const router = useRouter();

  const activeOrgId =
    (session as { activeOrganizationId?: string | null } | undefined)
      ?.activeOrganizationId ?? null;

  useEffect(() => {
    if (isPending) return;
    const inAuthGroup = segments[0] === "login";
    const onOrgPicker = segments[0] === "select-org";
    if (!session && !inAuthGroup) {
      router.replace("/login");
      return;
    }
    if (session && inAuthGroup) {
      router.replace("/");
      return;
    }
    // Signed in without an active org: every org-scoped query would fail with
    // "No active membership", so the choice comes first. `select-org` resolves
    // a single membership itself and continues without asking.
    if (session && !activeOrgId && !onOrgPicker) {
      router.replace("/select-org");
    }
  }, [session, activeOrgId, isPending, segments, router]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <PaletteProvider>
        <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="select-org"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="time-entry"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="capture-time"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="sick-leave"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="absence-request"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen name="chats/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="chats/new"
          options={{ presentation: "modal", headerShown: false }}
        />
        </Stack>
      </PaletteProvider>
    </ThemeProvider>
  );
}
