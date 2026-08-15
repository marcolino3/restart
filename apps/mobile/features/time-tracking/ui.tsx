/**
 * The shared surfaces of the time-tracking screens, taken from the design in
 * `design-reference.html`. Everything here is layout only — no data fetching,
 * no computation. Figures arrive already formatted from the caller.
 */
import React from "react";
import { Text, View, type ViewProps } from "react-native";

import { dayOfMonth, weekdayShort } from "./date-utils";

/** White panel with the soft shadow the design uses for cards and rows. */
export function Panel({
  className = "",
  children,
  ...rest
}: ViewProps & { className?: string }) {
  return (
    <View
      className={`bg-card shadow-sm shadow-black/5 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}

/** Section heading with an optional trailing action ("Alle anzeigen"). */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-baseline gap-3">
      <Text className="flex-1 text-[17px] font-semibold text-foreground">
        {title}
      </Text>
      {action}
    </View>
  );
}

/**
 * The 2×2 metric card: round accent icon, label, sub-label, and one large
 * mono figure. `muted` renders the dimmed variant used for a value that has
 * not happened yet (the design's "Gehen — noch offen").
 */
export function MetricCard({
  icon,
  label,
  hint,
  value,
  unit,
  muted = false,
  positive = false,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  value: string;
  unit?: string;
  muted?: boolean;
  positive?: boolean;
}) {
  return (
    <Panel
      className={`flex-1 rounded-card p-4 ${muted ? "bg-secondary shadow-none" : ""}`}
    >
      <View className="flex-row items-center gap-2.5">
        <View
          className={`h-[34px] w-[34px] items-center justify-center rounded-full ${
            muted ? "bg-field" : "bg-primary"
          }`}
        >
          {icon}
        </View>
        <View className="flex-1">
          <Text
            className={`text-[14.5px] font-semibold ${
              muted ? "text-muted-foreground" : "text-foreground"
            }`}
            numberOfLines={1}
          >
            {label}
          </Text>
          {hint ? (
            <Text
              className="text-[12.5px] text-muted-foreground"
              numberOfLines={1}
            >
              {hint}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="mt-3.5 flex-row items-baseline">
        <Text
          className={`font-mono-bold text-3xl ${
            muted
              ? "text-muted-foreground/60"
              : positive
                ? "text-status-green-fg"
                : "text-foreground"
          }`}
        >
          {value}
        </Text>
        {unit ? (
          <Text className="ml-1.5 text-sm font-medium text-muted-foreground">
            {unit}
          </Text>
        ) : null}
      </View>
    </Panel>
  );
}

/** The rounded date tile on the left of every entry row. */
export function DateTile({
  date,
  selected = false,
}: {
  date: string;
  selected?: boolean;
}) {
  return (
    <View
      className={`w-[66px] items-center justify-center gap-px rounded-tile py-3 ${
        selected ? "bg-card" : "bg-primary"
      }`}
    >
      <Text
        className={`font-mono-bold text-2xl ${
          selected ? "text-accent-foreground" : "text-primary-foreground"
        }`}
      >
        {dayOfMonth(date)}
      </Text>
      <Text
        className={`text-[11.5px] font-semibold ${
          selected ? "text-accent-foreground/85" : "text-primary-foreground/85"
        }`}
      >
        {weekdayShort(date)}
      </Text>
    </View>
  );
}

/** One of the three figures in an entry row: value over caption. */
function TripCell({
  value,
  caption,
  divider,
  selected,
}: {
  value: string;
  caption: string;
  divider: boolean;
  selected: boolean;
}) {
  return (
    <View
      className={`flex-1 items-center gap-0.5 ${
        divider
          ? selected
            ? "border-l border-accent-foreground/25"
            : "border-l border-border"
          : ""
      }`}
    >
      <Text
        className={`font-mono-bold text-[15.5px] ${
          selected ? "text-accent-foreground" : "text-foreground"
        }`}
      >
        {value}
      </Text>
      <Text
        className={`text-[10.5px] ${
          selected ? "text-accent-foreground/75" : "text-muted-foreground"
        }`}
      >
        {caption}
      </Text>
    </View>
  );
}

/**
 * An entry row: date tile, the come/go/total triple, and a footer line.
 * `selected` renders the filled variant the design uses for the active day.
 */
export function EntryRow({
  date,
  cells,
  footer,
  selected = false,
}: {
  date: string;
  cells: [string, string][];
  footer?: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <View
      className={`flex-row gap-3 rounded-row p-3 ${
        selected ? "bg-accent" : "bg-card shadow-sm shadow-black/5"
      }`}
    >
      <DateTile date={date} selected={selected} />
      <View className="flex-1 justify-center gap-2.5">
        <View className="flex-row">
          {cells.map(([value, caption], i) => (
            <TripCell
              key={caption}
              value={value}
              caption={caption}
              divider={i > 0}
              selected={selected}
            />
          ))}
        </View>
        {footer ? (
          <View
            className={`flex-row items-center justify-center gap-2 border-t pt-2 ${
              selected ? "border-accent-foreground/25" : "border-border"
            }`}
          >
            {footer}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Small pill used inside a row footer ("Krankheit", "Läuft gerade"). */
export function RowTag({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-status-amber-bg px-2 py-0.5">
      <Text className="text-[10.5px] font-semibold text-status-amber-fg">
        {label}
      </Text>
    </View>
  );
}
