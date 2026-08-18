/**
 * "Mehr" — the fifth slot of the design's tabbar. The design names the tab but
 * draws no screen for it, so this is assembled from the same primitives as the
 * other screens: a back-bar title, `.flabel` group captions and `.pick` rows.
 *
 * It holds what has no slot of its own: the palette picker and the entries that
 * moved out of the tabbar when "Mehr" took the fourth position.
 */
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useSession, signOut } from "@/lib/auth-client";
import { FieldLabel, PickRow, WideButton } from "@/features/time-tracking/sheet-ui";
import { ThemePicker } from "@/features/time-tracking/ThemePicker";
import { t } from "@/lib/i18n";

export default function MoreTab() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="gap-3 px-5 pb-32 pt-3">
        <Text className="text-[21px] font-semibold tracking-tight text-foreground">
          {t("MobileNav.morePageTitle")}
        </Text>

        <FieldLabel>{t("MobileNav.appearance")}</FieldLabel>
        <View className="gap-3 rounded-[18px] bg-card px-4 py-[13px] shadow-sm shadow-black/5">
          <View>
            <Text className="text-[11px] font-semibold text-muted-foreground">
              {t("MobileNav.theme")}
            </Text>
            <Text className="mt-px text-[14.5px] font-medium text-foreground">
              {t("MobileNav.themeHint")}
            </Text>
          </View>
          <ThemePicker />
        </View>

        <FieldLabel>{t("MobileNav.tabMore")}</FieldLabel>
        <PickRow
          icon="note"
          caption={t("MobileNav.moreChats")}
          value={t("MobileNav.moreChats")}
          onPress={() => router.push("/(tabs)/chats")}
        />

        <FieldLabel>{t("MobileNav.account")}</FieldLabel>
        <PickRow
          icon="face"
          caption={t("MobileNav.account")}
          value={session?.user?.email ?? "–"}
        />
        <WideButton
          icon="out"
          label={t("MobileNav.signOut")}
          onPress={() => {
            void signOut();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
