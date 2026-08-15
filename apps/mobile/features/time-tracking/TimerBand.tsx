/**
 * The dark band at the top of the "Heute" screen.
 *
 * Two states, both from the design: a running clock with the elapsed time and
 * a gold progress bar, and an idle state offering the two ways to record time
 * — clocking in, or entering a finished block by hand.
 *
 * The elapsed time ticks locally so the figure does not sit still for a
 * minute at a time; every persisted figure still comes from the backend.
 */
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { formatDuration } from "@/lib/time-tracking";
import { t } from "@/lib/i18n";

const GOLD = "#e9c46a";
const GOLD_INK = "#43350e";
const TIMER_FG = "#eef3e8";

const elapsedMinutes = (startedAt: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));

export function TimerBand({
  startedAt,
  plannedMinutes,
  busy,
  onStart,
  onStop,
  onManual,
}: {
  /** ISO timestamp of the open entry, or null when the clock is not running. */
  startedAt: string | null;
  /** The day's target in minutes; drives the progress bar. */
  plannedMinutes: number;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
  onManual: () => void;
}) {
  const [minutes, setMinutes] = useState(() =>
    startedAt ? elapsedMinutes(startedAt) : 0,
  );

  useEffect(() => {
    if (!startedAt) return;
    setMinutes(elapsedMinutes(startedAt));
    const id = setInterval(() => setMinutes(elapsedMinutes(startedAt)), 30_000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt) {
    return (
      <View className="rounded-band bg-timer p-[18px]">
        <Text className="text-[12.5px] font-semibold text-timer-foreground/70">
          {t("TimeTracking.noRunningEntry")}
        </Text>
        <View className="mt-2.5 flex-row items-end gap-3">
          <Text className="font-mono-bold text-[42px] leading-none text-timer-foreground">
            {formatDuration(0)}
          </Text>
          <Text className="pb-1 text-[13px] text-timer-foreground/70">
            {t("TimeTracking.ofPlanned", {
              planned: formatDuration(plannedMinutes),
            })}
          </Text>
        </View>
        <View className="mt-4 flex-row gap-2.5">
          <Pressable
            onPress={onManual}
            disabled={busy}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-timer-foreground/15 p-3 ${
              busy ? "opacity-60" : ""
            }`}
          >
            <FontAwesome name="pencil" size={15} color={TIMER_FG} />
            <Text className="text-[13.5px] font-semibold text-timer-foreground">
              {t("TimeTracking.addEntry")}
            </Text>
          </Pressable>
          <Pressable
            onPress={onStart}
            disabled={busy}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg p-3 ${
              busy ? "opacity-60" : ""
            }`}
            style={{ backgroundColor: GOLD }}
          >
            <FontAwesome name="play" size={15} color={GOLD_INK} />
            <Text
              className="text-[13.5px] font-semibold"
              style={{ color: GOLD_INK }}
            >
              {t("TimeTracking.startClock")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const progress =
    plannedMinutes > 0
      ? Math.min(100, Math.round((minutes / plannedMinutes) * 100))
      : 0;

  return (
    <View className="rounded-band bg-timer p-[18px]">
      <View className="flex-row items-center gap-2.5">
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: GOLD }}
        />
        <Text className="text-[12.5px] font-semibold text-timer-foreground/70">
          {t("TimeTracking.clockRunningSince", {
            time: new Date(startedAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })}
        </Text>
      </View>

      <View className="mt-2.5 flex-row items-end gap-3">
        <Text className="font-mono-bold text-[42px] leading-none text-timer-foreground">
          {formatDuration(minutes)}
        </Text>
        <Text className="pb-1 text-[13px] text-timer-foreground/70">
          {t("TimeTracking.ofPlanned", {
            planned: formatDuration(plannedMinutes),
          })}
        </Text>
      </View>

      <View className="mb-2 mt-3.5 h-1.5 overflow-hidden rounded-full bg-timer-foreground/20">
        <View
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: GOLD }}
        />
      </View>

      <View className="mt-4 flex-row gap-2.5">
        <Pressable
          onPress={onStop}
          disabled={busy}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg p-3 ${
            busy ? "opacity-60" : ""
          }`}
          style={{ backgroundColor: GOLD }}
        >
          <FontAwesome name="stop" size={15} color={GOLD_INK} />
          <Text
            className="text-[13.5px] font-semibold"
            style={{ color: GOLD_INK }}
          >
            {t("TimeTracking.stopClock")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
