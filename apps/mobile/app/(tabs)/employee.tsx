/**
 * "Heute" — the time-tracking home screen, built on the design in
 * `features/time-tracking/design-reference.html`.
 *
 * The running clock sits in a dark band, the period figures follow in a 2×2
 * grid, and the most recent days close the screen. Every number is taken from
 * the backend as delivered; nothing is recomputed here.
 */
import { useCallback, useState } from "react";
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
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useSession } from "@/lib/auth-client";
import { setActiveOrg } from "@/lib/gql-client";
import {
  fetchMyTimeTracking,
  formatDuration,
  gqlErrorMessage,
  startClock,
  stopClock,
  timeOf,
  type MyTimeTracking,
  type TimeEntry,
} from "@/lib/time-tracking";
import { TimerBand } from "@/features/time-tracking/TimerBand";
import {
  EntryRow,
  MetricCard,
  RowTag,
  SectionHeader,
} from "@/features/time-tracking/ui";
import { formatDateLine, todayEntryDate } from "@/features/time-tracking/date-utils";
import { t } from "@/lib/i18n";

const ICON_ON_PRIMARY = "#ffffff";
const ICON_MUTED = "#837d70";

/** How many days the home screen previews before "Verlauf" takes over. */
const PREVIEW_DAYS = 3;

export default function EmployeeTab() {
  const router = useRouter();
  const { data: session } = useSession();
  const activeOrgId =
    (session as { activeOrganizationId?: string | null } | undefined)
      ?.activeOrganizationId ?? null;

  const [data, setData] = useState<MyTimeTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      if (activeOrgId) setActiveOrg(activeOrgId);
      const result = await fetchMyTimeTracking();
      setData(result);
    } catch (e) {
      setError(gqlErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  // Runs on mount and every time the tab regains focus, e.g. after
  // returning from the manual-entry modal (create/edit/delete).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const runClock = async (action: (employeeId: string) => Promise<void>) => {
    if (!data?.employeeId) return;
    setBusy(true);
    try {
      await action(data.employeeId);
      await load();
    } catch (e) {
      setError(gqlErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    if (!data?.employeeId) return;
    router.push({
      pathname: "/time-entry",
      params: { employeeId: data.employeeId },
    });
  };

  const openDay = (entry: TimeEntry) => {
    // A running clock entry is ended via the band, not edited as a day.
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
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 p-6">
          <Text className="text-2xl font-bold text-foreground">
            {t("TimeTracking.myTime")}
          </Text>
          <Text className="mt-2 text-muted-foreground">
            {t("TimeTracking.noTimeTrackingProfile")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const today = todayEntryDate();
  const todayEntry =
    data.entries.find((e) => e.entryDate === today) ?? data.openEntry;
  // Newest first — the backend returns the period in ascending order.
  const recent = [...data.entries]
    .filter((e) => e.entryDate !== today)
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
    .slice(0, PREVIEW_DAYS);

  const net = data.balance?.netBalanceMinutes ?? 0;
  const plannedToday =
    data.monthlyGroups
      .flatMap((g) => g.days)
      .find((d) => d.date === today)?.plannedMinutes ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        <View className="gap-4 px-5 pb-32 pt-2">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">
                {formatDateLine(new Date())}
              </Text>
              <Text className="text-[21px] font-semibold text-foreground">
                {t("TimeTracking.myTime")}
              </Text>
            </View>
          </View>

          {error ? <Text className="text-destructive">{error}</Text> : null}

          <TimerBand
            startedAt={data.openEntry?.startedAt ?? null}
            plannedMinutes={plannedToday}
            busy={busy}
            onStart={() => void runClock(startClock)}
            onStop={() => void runClock(stopClock)}
            onManual={openCreate}
          />

          <View className="flex-row gap-3">
            <MetricCard
              icon={
                <FontAwesome
                  name="sign-in"
                  size={17}
                  color={ICON_ON_PRIMARY}
                />
              }
              label={t("TimeTracking.startTime")}
              value={timeOf(todayEntry?.startedAt)}
            />
            <MetricCard
              icon={
                <FontAwesome
                  name="sign-out"
                  size={17}
                  color={todayEntry?.endedAt ? ICON_ON_PRIMARY : ICON_MUTED}
                />
              }
              label={t("TimeTracking.endTime")}
              hint={todayEntry?.endedAt ? undefined : t("TimeTracking.running")}
              value={timeOf(todayEntry?.endedAt)}
              muted={!todayEntry?.endedAt}
            />
          </View>

          <View className="flex-row gap-3">
            <MetricCard
              icon={
                <FontAwesome name="bar-chart" size={16} color={ICON_ON_PRIMARY} />
              }
              label={t("TimeTracking.netBalance")}
              hint={t("TimeTracking.period")}
              value={formatDuration(net)}
              positive={net > 0}
            />
            <MetricCard
              icon={
                <FontAwesome
                  name="calendar-o"
                  size={16}
                  color={ICON_ON_PRIMARY}
                />
              }
              label={t("TimeTracking.absenceDays")}
              hint={t("TimeTracking.period")}
              value={String(data.balance?.absenceDaysCount ?? 0)}
            />
          </View>

          <SectionHeader
            title={t("TimeTracking.entries")}
            action={
              <Pressable onPress={openCreate} hitSlop={8}>
                <Text className="text-[13px] font-semibold text-accent-foreground">
                  {t("TimeTracking.addEntry")}
                </Text>
              </Pressable>
            }
          />

          {recent.length === 0 ? (
            <Text className="text-muted-foreground">
              {t("TimeTracking.noEntriesYet")}
            </Text>
          ) : (
            <View className="gap-2.5">
              {recent.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => openDay(e)}
                  className="active:opacity-70"
                >
                  <EntryRow
                    date={e.entryDate}
                    cells={[
                      [timeOf(e.startedAt), t("TimeTracking.startTime")],
                      [timeOf(e.endedAt), t("TimeTracking.endTime")],
                      [
                        e.workMinutes != null
                          ? formatDuration(e.workMinutes)
                          : "–",
                        t("TimeTracking.duration"),
                      ],
                    ]}
                    footer={
                      e.source === "MANUAL" ? (
                        <RowTag label={t("TimeTracking.manual")} />
                      ) : e.notes ? (
                        <Text
                          className="text-xs text-muted-foreground"
                          numberOfLines={1}
                        >
                          {e.notes}
                        </Text>
                      ) : undefined
                    }
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
