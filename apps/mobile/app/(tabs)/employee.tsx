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
import { t } from "@/lib/i18n";

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

  const toggleClock = async () => {
    if (!data?.employeeId) return;
    setBusy(true);
    try {
      if (data.openEntry) await stopClock(data.employeeId);
      else await startClock(data.employeeId);
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

  const openEdit = (entry: TimeEntry) => {
    // Open clock entries (still running) are managed via the clock, not editable.
    if (!entry.endedAt) return;
    router.push({
      pathname: "/time-entry",
      params: {
        id: entry.id,
        startedAt: entry.startedAt,
        endedAt: entry.endedAt,
        breakMinutes: entry.breakMinutes != null ? String(entry.breakMinutes) : "",
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

  const isRunning = Boolean(data.openEntry);
  const net = data.balance?.netBalanceMinutes ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        <View className="gap-5 p-5">
          <Text className="text-2xl font-bold text-foreground">
            {t("TimeTracking.myTime")}
          </Text>

          {error ? <Text className="text-destructive">{error}</Text> : null}

          {/* Saldo-Karten */}
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-md border border-border p-4">
              <Text className="text-xs text-muted-foreground">
                {t("TimeTracking.netBalance")}
              </Text>
              <Text
                className={`mt-1 text-xl font-bold ${
                  net > 0
                    ? "text-green-600"
                    : net < 0
                      ? "text-red-600"
                      : "text-foreground"
                }`}
              >
                {formatDuration(net)}
              </Text>
            </View>
            <View className="flex-1 rounded-md border border-border p-4">
              <Text className="text-xs text-muted-foreground">
                {t("TimeTracking.vacationRemaining")}
              </Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                {(data.vacation?.remainingDays ?? 0).toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Stempeluhr */}
          <Pressable
            onPress={toggleClock}
            disabled={busy}
            className={`items-center rounded-md px-4 py-4 ${
              isRunning ? "bg-destructive" : "bg-primary"
            } ${busy ? "opacity-60" : ""}`}
          >
            <Text className="text-base font-semibold text-primary-foreground">
              {isRunning
                ? t("TimeTracking.stopClock")
                : t("TimeTracking.startClock")}
            </Text>
          </Pressable>
          {isRunning ? (
            <Text className="text-center text-sm text-muted-foreground">
              ▶ {timeOf(data.openEntry?.startedAt)}
            </Text>
          ) : null}

          {/* Verlauf */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">
                {t("TimeTracking.entries")}
              </Text>
              <Pressable onPress={openCreate} hitSlop={8}>
                <Text className="text-sm font-medium text-primary">
                  + {t("TimeTracking.addEntry")}
                </Text>
              </Pressable>
            </View>
            {data.entries.length === 0 ? (
              <Text className="text-muted-foreground">–</Text>
            ) : (
              data.entries.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => openEdit(e)}
                  disabled={!e.endedAt}
                  className="flex-row items-center justify-between rounded-md border border-border px-3 py-2 active:opacity-70"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-foreground">{e.entryDate}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {timeOf(e.startedAt)} – {timeOf(e.endedAt)}
                      {e.notes ? ` · ${e.notes}` : ""}
                    </Text>
                  </View>
                  <Text className="font-medium text-foreground">
                    {e.workMinutes != null
                      ? formatDuration(e.workMinutes)
                      : "…"}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
