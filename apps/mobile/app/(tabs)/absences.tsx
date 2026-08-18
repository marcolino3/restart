/**
 * "Absenzen" — the fourth tab slot of the design. For now it holds the entry
 * point to the existing sick-leave report; the absence list follows with the
 * remaining time-tracking screens.
 */
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "@/features/time-tracking/Icon";
import { useColors } from "@/lib/theme";

import { t } from "@/lib/i18n";

export default function AbsencesTab() {
  const router = useRouter();
  const colors = useColors();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1 gap-4 px-5 pt-2">
        <Text className="text-[21px] font-semibold text-foreground">
          {t("TimeTracking.myAbsences")}
        </Text>

        <Pressable
          onPress={() => router.push("/sick-leave")}
          className="flex-row items-center justify-center gap-2 rounded-lg border border-border bg-card p-3.5 active:opacity-70"
        >
          <Icon name="plus" size={16} color={colors.foreground} />
          <Text className="text-sm font-semibold text-foreground">
            {t("SickLeave.title")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
