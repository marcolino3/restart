/**
 * "Absenzen" — self-service tab: report sick, report or request an absence and
 * see the own absences with their approval state.
 */
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { Icon } from "@/features/time-tracking/Icon";
import {
  absenceCategoryName,
  fetchMyAbsences,
  withdrawAbsenceRequest,
  type AbsenceStatus,
  type MyAbsence,
} from "@/lib/absences";
import { gqlErrorMessage } from "@/lib/time-tracking";
import { useColors } from "@/lib/theme";
import { i18n, t } from "@/lib/i18n";

const statusClasses: Record<AbsenceStatus, string> = {
  PENDING: "border-border bg-muted",
  APPROVED: "border-border bg-card",
  REJECTED: "border-destructive bg-card",
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(i18n.locale);
};

const formatRange = (absence: MyAbsence) => {
  const start = formatDate(absence.startDate);
  const end = formatDate(absence.endDate);
  return end && end !== start ? `${start} – ${end}` : start;
};

export default function AbsencesTab() {
  const router = useRouter();
  const colors = useColors();

  const [absences, setAbsences] = useState<MyAbsence[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setAbsences(await fetchMyAbsences());
    } catch (e) {
      setAbsences([]);
      Alert.alert(t("Common.error"), gqlErrorMessage(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const confirmWithdraw = (absence: MyAbsence) => {
    Alert.alert(
      t("Employees.absence.withdrawTitle"),
      t("Employees.absence.withdrawConfirm"),
      [
        { text: t("Common.cancel"), style: "cancel" },
        {
          text: t("Employees.absence.withdraw"),
          style: "destructive",
          onPress: async () => {
            try {
              await withdrawAbsenceRequest(absence.id);
              await load();
            } catch (e) {
              Alert.alert(t("Common.error"), gqlErrorMessage(e));
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1 gap-4 px-5 pt-2">
        <Text className="text-[21px] font-semibold text-foreground">
          {t("TimeTracking.myAbsences")}
        </Text>

        <View className="gap-2">
          <Pressable
            onPress={() => router.push("/sick-leave")}
            className="flex-row items-center justify-center gap-2 rounded-lg border border-border bg-card p-3.5 active:opacity-70"
          >
            <Icon name="plus" size={16} color={colors.foreground} />
            <Text className="text-sm font-semibold text-foreground">
              {t("SickLeave.title")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/absence-request")}
            className="flex-row items-center justify-center gap-2 rounded-lg border border-border bg-card p-3.5 active:opacity-70"
          >
            <Icon name="plus" size={16} color={colors.foreground} />
            <Text className="text-sm font-semibold text-foreground">
              {t("Common.createAbsenceNotice")}
            </Text>
          </Pressable>
        </View>

        {absences === null ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <FlatList
            data={absences}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-2 pb-6"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            }
            ListEmptyComponent={
              <Text className="text-sm text-muted-foreground">
                {t("Common.myAbsencesEmpty")}
              </Text>
            }
            renderItem={({ item }) => (
              <View
                className={`gap-1 rounded-lg border p-3.5 ${statusClasses[item.status]}`}
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-sm font-semibold text-foreground">
                    {absenceCategoryName(item.absenceCategory, i18n.locale)}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {t(`Employees.absence.status.${item.status}`)}
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground">
                  {formatRange(item)}
                </Text>
                {item.note ? (
                  <Text className="text-xs text-muted-foreground">
                    {item.note}
                  </Text>
                ) : null}
                {item.status === "REJECTED" && item.decisionNote ? (
                  <Text className="text-xs text-destructive">
                    {item.decisionNote}
                  </Text>
                ) : null}
                {item.status === "PENDING" ? (
                  <Pressable
                    onPress={() => confirmWithdraw(item)}
                    className="self-start pt-1 active:opacity-70"
                  >
                    <Text className="text-xs font-semibold text-destructive">
                      {t("Employees.absence.withdraw")}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
