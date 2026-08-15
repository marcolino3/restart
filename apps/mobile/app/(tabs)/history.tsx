/**
 * "Verlauf" — month calendar over the accounting period. The screen itself
 * lands in the next step; this keeps the tab slot routable in the meantime.
 */
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { t } from "@/lib/i18n";

export default function HistoryTab() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1 px-5 pt-2">
        <Text className="text-[21px] font-semibold text-foreground">
          {t("MobileNav.tabHistory")}
        </Text>
      </View>
    </SafeAreaView>
  );
}
