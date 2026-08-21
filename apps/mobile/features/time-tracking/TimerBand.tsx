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

import { formatDuration } from "@/lib/time-tracking";
import { useColors, withAlpha } from "@/lib/theme";
import { Icon, type IconName } from "./Icon";
import { t } from "@/lib/i18n";

/** `#rrggbb` plus an alpha, for the two translucent tones the band uses. */
/**
 * `.run .acts button` — one of the band's actions. `primary` is the gold
 * variant the design uses for the clocking action.
 */
function BandButton({
  icon,
  label,
  onPress,
  disabled,
  primary = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled: boolean;
  primary?: boolean;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{
        flex: 1,
        borderRadius: 14,
        padding: 12,
        opacity: disabled ? 0.6 : 1,
        backgroundColor: primary
          ? colors.gold
          : withAlpha(colors.timerForeground, 0.14),
      }}
      className="flex-row items-center justify-center gap-[7px]"
    >
      <Icon
        name={icon}
        size={15}
        color={primary ? colors.goldForeground : colors.timerForeground}
      />
      <Text
        className="text-[13.5px] font-semibold"
        style={{ color: primary ? colors.goldForeground : colors.timerForeground }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const elapsedMinutes = (startedAt: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));

export function TimerBand({
  startedAt,
  plannedMinutes,
  breakMinutes = null,
  expectedEnd = null,
  busy,
  onStart,
  onStop,
  onManual,
}: {
  /** ISO timestamp of the open entry, or null when the clock is not running. */
  startedAt: string | null;
  /** The day's target in minutes; drives the progress bar. */
  plannedMinutes: number;
  /** Break already deducted today, or null when the day records none. */
  breakMinutes?: number | null;
  /** `HH:MM` the day is projected to end at, or null when not computable. */
  expectedEnd?: string | null;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
  onManual: () => void;
}) {
  const colors = useColors();
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
      <View className="rounded-band bg-timer px-[18px] pb-4 pt-[18px]">
        <Text
          className="text-[12.5px] font-semibold"
          style={{ color: withAlpha(colors.timerForeground, 0.7) }}
        >
          {t("TimeTracking.noRunningEntry")}
        </Text>
        <View className="mt-2.5 flex-row items-end gap-3">
          <Text className="font-mono-bold text-[42px] leading-none text-timer-foreground">
            {formatDuration(0)}
          </Text>
          <Text
            className="pb-1 text-[13px]"
            style={{ color: withAlpha(colors.timerForeground, 0.7) }}
          >
            {t("TimeTracking.ofPlanned", {
              planned: formatDuration(plannedMinutes),
            })}
          </Text>
        </View>
        <View className="mt-[15px] flex-row gap-[9px]">
          <BandButton
            icon="edit"
            label={t("TimeTracking.addEntry")}
            onPress={onManual}
            disabled={busy}
          />
          <BandButton
            icon="fingerprint"
            label={t("TimeTracking.startClock")}
            onPress={onStart}
            disabled={busy}
            primary
          />
        </View>
      </View>
    );
  }

  const progress =
    plannedMinutes > 0
      ? Math.min(100, Math.round((minutes / plannedMinutes) * 100))
      : 0;

  return (
    <View className="rounded-band bg-timer px-[18px] pb-4 pt-[18px]">
      <View className="flex-row items-center gap-[9px]">
        {/*
         * The design rings the 8px dot with a 4px halo of the same gold at 26%.
         * A border would grow inwards here, so the halo is its own 16px circle.
         */}
        <View
          className="h-4 w-4 items-center justify-center rounded-full"
          style={{ backgroundColor: withAlpha(colors.gold, 0.26) }}
        >
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colors.gold }}
          />
        </View>
        <Text
          className="text-[12.5px] font-semibold"
          style={{ color: withAlpha(colors.timerForeground, 0.7) }}
        >
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
        <Text
            className="pb-1 text-[13px]"
            style={{ color: withAlpha(colors.timerForeground, 0.7) }}
          >
          {t("TimeTracking.ofPlanned", {
            planned: formatDuration(plannedMinutes),
          })}
        </Text>
      </View>

      <View
        className="mb-2 mt-3.5 h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: withAlpha(colors.timerForeground, 0.18) }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: colors.gold }}
        />
      </View>

      {/*
       * `.rf` — the design shows the deducted break on the left and the
       * projected end on the right. Both are omitted when unknown rather than
       * shown as a placeholder.
       */}
      {breakMinutes != null || expectedEnd ? (
        <View className="flex-row justify-between">
          <Text
            className="text-[11.5px]"
            style={{ color: withAlpha(colors.timerForeground, 0.62) }}
          >
            {breakMinutes != null
              ? t("TimeTracking.breakDeducted", {
                  duration: formatDuration(breakMinutes),
                })
              : ""}
          </Text>
          <Text
            className="text-[11.5px]"
            style={{ color: withAlpha(colors.timerForeground, 0.62) }}
          >
            {expectedEnd
              ? t("TimeTracking.expectedEnd", { time: expectedEnd })
              : ""}
          </Text>
        </View>
      ) : null}

      <View className="mt-[15px] flex-row gap-[9px]">
        {/*
         * The design pairs the stop button with "Pause". Pausing has no backend
         * operation, so the slot is drawn but disabled rather than offered.
         */}
        <BandButton
          icon="pause"
          label={t("TimeTracking.pause")}
          onPress={() => {}}
          disabled
        />
        <BandButton
          icon="stop"
          label={t("TimeTracking.stopClock")}
          onPress={onStop}
          disabled={busy}
          primary
        />
      </View>
    </View>
  );
}
