import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "@/lib/auth-client";
import { useSignOut } from "@/lib/use-sign-out";
import { t } from "@/lib/i18n";

export default function HomeScreen() {
  const { data: session } = useSession();
  const { handleSignOut, signingOut } = useSignOut();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6">
        <Text className="text-2xl font-bold text-foreground">
          {t("MobileNav.tabToday")}
        </Text>
        {session?.user?.email ? (
          <Text className="mt-2 text-muted-foreground">
            {session.user.email}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void handleSignOut()}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityState={{ disabled: signingOut }}
          accessibilityLabel={t("MobileNav.signOut")}
          className="mt-8 self-start rounded-md border border-border px-4 py-2"
        >
          <Text className="text-foreground">{t("MobileNav.signOut")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
