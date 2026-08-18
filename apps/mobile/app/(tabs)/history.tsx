/**
 * "Verlauf" — the month calendar over the accounting period, the month's
 * target/actual/balance strip, and the days of that month as rows.
 *
 * The calendar walks the months the backend delivered; there is nothing to
 * show outside them, so the arrows stop at both ends of the period.
 */
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { useSession } from "@/lib/auth-client";
import { setActiveOrg } from "@/lib/gql-client";
import {
  fetchMyTimeTracking,
  formatDuration,
  gqlErrorMessage,
  timeOf,
  type MyTimeTracking,
  type TimeEntry,
} from "@/lib/time-tracking";
import {
  MonthCalendar,
  MonthSummary,
} from "@/features/time-tracking/MonthCalendar";
import {
  BackHeader,
  EntryRow,
  RoundButton,
  RowTag,
  SectionHeader,
} from "@/features/time-tracking/ui";
import { parseEntryDate, todayEntryDate } from "@/features/time-tracking/date-utils";
import { t } from "@/lib/i18n";

export default function HistoryTab() {
  const router = useRouter();
  const { data: session } = useSession();
  const activeOrgId =
    (session as { activeOrganizationId?: string | null } | undefined)
      ?.activeOrganizationId ?? null;

  const [data, setData] = useState<MyTimeTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(todayEntryDate);

  const load = useCallback(async () => {
    try {
      setError(null);
      if (activeOrgId) setActiveOrg(activeOrgId);
      setData(await fetchMyTimeTracking());
    } catch (e) {
      setError(gqlErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const groups = useMemo(() => data?.monthlyGroups ?? [], [data]);

  // The month the selected day falls into, clamped to the months the period
  // actually covers.
  const monthIndex = useMemo(() => {
    if (groups.length === 0) return -1;
    const d = parseEntryDate(selected);
    const found = groups.findIndex(
      (g) => g.year === d.getFullYear() && g.month === d.getMonth() + 1,
    );
    return found >= 0 ? found : groups.length - 1;
  }, [groups, selected]);

  const group = monthIndex >= 0 ? groups[monthIndex] : null;

  const missingDays = useMemo(
    () => new Set(data?.missingRecordDays ?? []),
    [data?.missingRecordDays],
  );

  const entriesByDate = useMemo(
    () => new Map((data?.entries ?? []).map((e) => [e.entryDate, e])),
    [data?.entries],
  );

  const stepMonth = (delta: number) => {
    const next = groups[monthIndex + delta];
    if (!next) return;
    // Land on the first of the new month rather than keeping a day number
    // that may not exist there.
    setSelected(`${next.year}-${String(next.month).padStart(2, "0")}-01`);
  };

  const openDay = (entry: TimeEntry) => {
    if (!entry.endedAt) return;
    router.push({
      pathname: "/time-entry",
      params: {
        id: entry.id,
        startedAt: entry.startedAt,
        endedAt: entry.endedAt,
        breakMinutes:
          entry.breakMinutes != null ? String(entry.breakMinutes) : "",
        notes: entry.notes ?? "",
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!data?.employeeId) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 p-6">
          <Text className="text-2xl font-bold text-foreground">
            {t("MobileNav.tabHistory")}
          </Text>
          <Text className="mt-2 text-muted-foreground">
            {t("TimeTracking.noTimeTrackingProfile")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const balance = group ? group.workedMinutes - group.plannedMinutes : 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        <View className="gap-4 px-5 pb-32 pt-2">
          <BackHeader
            title={t("MobileNav.tabHistory")}
            // A tab may be the first screen in the stack; fall back to "Heute"
            // so the arrow always leads somewhere.
            onBack={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)/employee")
            }
            backLabel={t("MobileNav.back")}
            action={
              <RoundButton
                icon="sum"
                label={t("MobileNav.summary")}
                small
                disabled
              />
            }
          />

          {error ? <Text className="text-destructive">{error}</Text> : null}

          {group ? (
            <>
              <MonthCalendar
                year={group.year}
                month={group.month - 1}
                days={group.days}
                missingDays={missingDays}
                selected={selected}
                onSelect={setSelected}
                onPrev={() => stepMonth(-1)}
                onNext={() => stepMonth(1)}
              />

              <MonthSummary
                cells={[
                  {
                    value: formatDuration(group.plannedMinutes),
                    caption: t("TimeTracking.planned"),
                  },
                  {
                    value: formatDuration(group.workedMinutes),
                    caption: t("TimeTracking.actual"),
                  },
                  {
                    value: formatDuration(balance),
                    caption: t("TimeTracking.netBalance"),
                    positive: balance > 0,
                  },
                ]}
              />

              <SectionHeader title={t("TimeTracking.entries")} />

              <View className="gap-2.5">
                {group.days.map((day) => {
                  const entry = entriesByDate.get(day.date);
                  const isEntry = day.kind === "ENTRY";

                  return (
                    <Pressable
                      key={day.date}
                      onPress={() => {
                        setSelected(day.date);
                        if (entry) openDay(entry);
                      }}
                      className="active:opacity-70"
                    >
                      <EntryRow
                        date={day.date}
                        selected={day.date === selected}
                        cells={[
                          [
                            isEntry ? timeOf(entry?.startedAt) : "–",
                            t("TimeTracking.startTime"),
                          ],
                          [
                            isEntry ? timeOf(entry?.endedAt) : "–",
                            t("TimeTracking.endTime"),
                          ],
                          [
                            formatDuration(day.workMinutes),
                            t("TimeTracking.duration"),
                          ],
                        ]}
                        footer={
                          day.label ? (
                            <RowTag label={day.label} />
                          ) : missingDays.has(day.date) ? (
                            <RowTag label={t("TimeTracking.missingRecords", { count: 1 })} />
                          ) : entry?.notes ? (
                            <Text
                              className="text-xs text-muted-foreground"
                              numberOfLines={1}
                            >
                              {entry.notes}
                            </Text>
                          ) : undefined
                        }
                      />
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <Text className="text-muted-foreground">
              {t("TimeTracking.noEntriesYet")}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
