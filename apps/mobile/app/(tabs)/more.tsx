import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useSignOut } from "@/lib/use-sign-out";
import { t } from "@/lib/i18n";

export default function MoreTab() {
  const router = useRouter();
  const { handleSignOut, signingOut } = useSignOut();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-2 p-6">
        <Text className="text-2xl font-bold text-foreground">
          {t("MobileNav.morePageTitle")}
        </Text>

        <Pressable
          className="mt-4 rounded-xl border border-border p-4"
          onPress={() => router.push("/(tabs)/employee")}
          accessibilityRole="button"
          accessibilityLabel={t("MobileNav.moreTimeTracking")}
        >
          <Text className="font-semibold text-foreground">
            {t("MobileNav.moreTimeTracking")}
          </Text>
        </Pressable>

        <Pressable
          className="rounded-xl border border-border p-4"
          onPress={() => router.push("/(tabs)/teacher")}
          accessibilityRole="button"
          accessibilityLabel={t("MobileNav.moreClasses")}
        >
          <Text className="font-semibold text-foreground">
            {t("MobileNav.moreClasses")}
          </Text>
        </Pressable>

        <Pressable
          className="mt-4 rounded-xl border border-border p-4"
          onPress={() => void handleSignOut()}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityState={{ disabled: signingOut }}
          accessibilityLabel={t("MobileNav.signOut")}
        >
          <Text className="font-semibold text-destructive">
            {t("MobileNav.signOut")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
