/**
 * The month calendar of the "Verlauf" screen.
 *
 * Each day carries a dot: green for a recorded day, rose for an absence or
 * holiday, amber for a working day the backend reports as missing. The
 * selected day is a filled circle. Which day is which comes entirely from the
 * backend's monthly groups — the grid itself is the only thing computed here.
 */
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useColors, withAlpha } from "@/lib/theme";
import { Icon } from "./Icon";

import {
  monthGrid,
  monthLabel,
  parseEntryDate,
  type CalendarCell,
} from "./date-utils";
import type { DailyTimeTracking } from "@/lib/time-tracking";

const WEEKDAY_HEADS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

/**
 * Marker colour for a day, or null when the day gets no dot. The palette is
 * passed in rather than read from a constant, so the dots follow the theme.
 */
const dotColor = (
  day: DailyTimeTracking | undefined,
  missing: boolean,
  colors: { primary: string; destructive: string; amberFg: string },
): string | null => {
  if (day) {
    if (day.kind === "ENTRY") return colors.primary;
    // A category may carry its own colour; fall back to the rose the design
    // uses for every kind of day off.
    if (day.kind === "ABSENCE") return day.color ?? colors.destructive;
    if (day.kind === "VACATION" || day.kind === "HOLIDAY")
      return colors.destructive;
  }
  return missing ? colors.amberFg : null;
};

export function MonthCalendar({
  year,
  month,
  days,
  missingDays,
  selected,
  onSelect,
  onPrev,
  onNext,
}: {
  year: number;
  /** 0-based, as JavaScript counts months. */
  month: number;
  /** The days of this month as the backend delivered them. */
  days: DailyTimeTracking[];
  /** Working days without a record, flagged in amber. */
  missingDays: Set<string>;
  selected: string;
  onSelect: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const colors = useColors();
  const byDate = new Map(days.map((d) => [d.date, d]));
  const cells = monthGrid(year, month);

  const renderCell = (cell: CalendarCell) => {
    const isSelected = cell.date === selected;
    const dot = cell.inMonth
      ? dotColor(byDate.get(cell.date), missingDays.has(cell.date), colors)
      : null;

    return (
      <Pressable
        key={cell.date}
        onPress={() => onSelect(cell.date)}
        disabled={!cell.inMonth}
        // Seven per row; the height leaves room for the dot underneath.
        style={{ width: `${100 / 7}%` }}
        className="h-[38px] items-center justify-center"
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View
          className={`h-[38px] w-[38px] items-center justify-center rounded-full ${
            isSelected ? "bg-primary" : ""
          }`}
        >
          <Text
            className={`text-[13.5px] ${
              isSelected
                ? "font-semibold text-primary-foreground"
                : cell.inMonth
                  ? "text-foreground"
                  : ""
            }`}
            style={
              !isSelected && !cell.inMonth
                ? { color: withAlpha(colors.mutedForeground, 0.45) }
                : undefined
            }
          >
            {parseEntryDate(cell.date).getDate()}
          </Text>
          {dot ? (
            <View
              className="absolute bottom-1 h-[5px] w-[5px] rounded-full"
              style={{
                backgroundColor: isSelected ? colors.primaryForeground : dot,
              }}
            />
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View className="rounded-band bg-card px-3.5 pb-3.5 pt-4 shadow-sm shadow-black/5">
      <View className="mb-3.5 flex-row items-center justify-center gap-3.5">
        <Pressable
          onPress={onPrev}
          hitSlop={10}
          className="h-7 w-7 items-center justify-center rounded-full bg-primary"
          accessibilityRole="button"
        >
          <Icon name="left" size={14} color={colors.primaryForeground} />
        </Pressable>
        <Text className="text-[15.5px] font-semibold text-foreground">
          {monthLabel(year, month)}
        </Text>
        <Pressable
          onPress={onNext}
          hitSlop={10}
          className="h-7 w-7 items-center justify-center rounded-full bg-primary"
          accessibilityRole="button"
        >
          <Icon name="right" size={14} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAY_HEADS.map((d) => (
          <Text
            key={d}
            style={{ width: `${100 / 7}%` }}
            className="pb-2 text-center text-[11.5px] font-semibold text-muted-foreground"
          >
            {d}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">{cells.map(renderCell)}</View>
    </View>
  );
}

/** Soll / Ist / Saldo strip below the calendar. */
export function MonthSummary({
  cells,
}: {
  cells: { value: string; caption: string; positive?: boolean }[];
}) {
  return (
    <View className="flex-row rounded-row bg-card px-1 py-3.5 shadow-sm shadow-black/5">
      {cells.map((cell, i) => (
        <View
          key={cell.caption}
          className={`flex-1 items-center gap-0.5 ${
            i > 0 ? "border-l border-border" : ""
          }`}
        >
          <Text
            className={`font-mono-bold text-[17px] ${
              cell.positive ? "text-status-green-fg" : "text-foreground"
            }`}
          >
            {cell.value}
          </Text>
          <Text className="text-[11.5px] text-muted-foreground">
            {cell.caption}
          </Text>
        </View>
      ))}
    </View>
  );
}
