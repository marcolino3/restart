/**
 * "Heute" — the time-tracking home screen, built on the design in
 * `features/time-tracking/design-reference.html`.
 *
 * The running clock sits in a dark band, the period figures follow in a 2×2
 * grid, and the most recent days close the screen. Every number is taken from
 * the backend as delivered; nothing is recomputed here.
 */
import { useCallback, useEffect, useState } from "react";
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

import { Icon } from "@/features/time-tracking/Icon";
import { useColors } from "@/lib/theme";

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
import { activeOrgName } from "@/lib/active-org";
import {
  DateLocationLine,
  EntryRow,
  GreetingHeader,
  MetricCard,
  RowTag,
  SectionHeader,
} from "@/features/time-tracking/ui";
import {
  formatDateLine,
  todayEntryDate,
} from "@/features/time-tracking/date-utils";
import { t } from "@/lib/i18n";


/** How many days the home screen previews before "Verlauf" takes over. */
const PREVIEW_DAYS = 3;

/** The design greets by time of day: morning until 11, afternoon until 17. */
const greetingKey = (): string => {
  const hour = new Date().getHours();
  if (hour < 11) return t("MobileNav.greetingMorning");
  if (hour < 17) return t("MobileNav.greetingAfternoon");
  return t("MobileNav.greetingEvening");
};

export default function EmployeeTab() {
  const router = useRouter();
  const colors = useColors();
  const { data: session } = useSession();
  const activeOrgId =
    (session as { activeOrganizationId?: string | null } | undefined)
      ?.activeOrganizationId ?? null;

  const [data, setData] = useState<MyTimeTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

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

  // The place next to the date. Loaded separately: it is decoration, so a
  // failure here must not keep the screen's figures from rendering.
  useEffect(() => {
    let cancelled = false;
    void activeOrgName(activeOrgId).then((name) => {
      if (!cancelled) setOrgName(name);
    });
    return () => {
      cancelled = true;
    };
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
      pathname: "/capture-time",
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

  /**
   * When the day is projected to end: start plus the day's target plus the
   * break already taken. Null unless the clock is running and a target exists,
   * since the design's line would otherwise state a time nothing backs.
   */
  const expectedEnd = (() => {
    const started = data.openEntry?.startedAt;
    if (!started || plannedToday <= 0) return null;
    const end = new Date(
      new Date(started).getTime() +
        (plannedToday + (todayEntry?.breakMinutes ?? 0)) * 60_000,
    );
    return `${String(end.getHours()).padStart(2, "0")}:${String(
      end.getMinutes(),
    ).padStart(2, "0")}`;
  })();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        <View className="gap-4 px-5 pb-32 pt-2">
          <GreetingHeader
            greeting={greetingKey()}
            name={session?.user?.name ?? t("TimeTracking.myTime")}
            notificationsLabel={t("MobileNav.notifications")}
          />

          <DateLocationLine
            date={formatDateLine(new Date())}
            location={orgName}
          />

          {error ? <Text className="text-destructive">{error}</Text> : null}

          <TimerBand
            startedAt={data.openEntry?.startedAt ?? null}
            plannedMinutes={plannedToday}
            breakMinutes={todayEntry?.breakMinutes ?? null}
            expectedEnd={expectedEnd}
            busy={busy}
            onStart={() => void runClock(startClock)}
            onStop={() => void runClock(stopClock)}
            onManual={openCreate}
          />

          <View className="flex-row gap-3">
            <MetricCard
              icon={<Icon name="in" size={17} color={colors.primaryForeground} />}
              label={t("TimeTracking.startTime")}
              value={timeOf(todayEntry?.startedAt)}
            />
            <MetricCard
              icon={
                <Icon
                  name="out"
                  size={17}
                  color={
                    todayEntry?.endedAt
                      ? colors.primaryForeground
                      : colors.mutedForeground
                  }
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
              icon={<Icon name="sum" size={17} color={colors.primaryForeground} />}
              label={t("TimeTracking.netBalance")}
              hint={t("TimeTracking.period")}
              value={formatDuration(net)}
              positive={net > 0}
            />
            <MetricCard
              icon={
                <Icon name="calendarOff" size={17} color={colors.primaryForeground} />
              }
              label={t("TimeTracking.absenceDays")}
              hint={t("TimeTracking.period")}
              value={String(data.balance?.absenceDaysCount ?? 0)}
              unit={t("TimeTracking.daysUnit")}
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
