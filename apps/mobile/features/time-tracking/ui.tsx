/**
 * The shared surfaces of the time-tracking screens, taken from the design in
 * `design-reference.html`. Everything here is layout only — no data fetching,
 * no computation. Figures arrive already formatted from the caller.
 */
import React from "react";
import { Pressable, Text, View, type ViewProps } from "react-native";

import { useColors, withAlpha } from "@/lib/theme";
import { Icon, type IconName } from "./Icon";
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
    <View className="mt-1 flex-row items-baseline gap-2.5">
      <Text className="flex-1 text-[17px] font-semibold tracking-tight text-foreground">
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
  const colors = useColors();

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
            positive && !muted ? "text-status-green-fg" : "text-foreground"
          }`}
          style={
            muted ? { color: withAlpha(colors.mutedForeground, 0.6) } : undefined
          }
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
  const colors = useColors();

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
        className="text-[11.5px] font-semibold"
        style={{
          color: withAlpha(
            selected ? colors.accentForeground : colors.primaryForeground,
            0.85,
          ),
        }}
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
  const colors = useColors();

  return (
    <View
      className={`flex-1 items-center gap-0.5 ${divider ? "border-l" : ""}`}
      style={
        divider && selected
          ? { borderLeftColor: withAlpha(colors.accentForeground, 0.25) }
          : undefined
      }
    >
      <Text
        className={`font-mono-bold text-[15.5px] ${
          selected ? "text-accent-foreground" : "text-foreground"
        }`}
      >
        {value}
      </Text>
      <Text
        className={`text-[10.5px] ${selected ? "" : "text-muted-foreground"}`}
        style={
          selected
            ? { color: withAlpha(colors.accentForeground, 0.75) }
            : undefined
        }
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
  const colors = useColors();

  return (
    <View
      className={`flex-row gap-3 rounded-row p-3 ${
        selected ? "bg-accent" : "bg-card shadow-sm shadow-black/5"
      }`}
    >
      <DateTile date={date} selected={selected} />
      <View className="flex-1 justify-center gap-[9px]">
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
            className={`flex-row items-center justify-center gap-[7px] border-t pt-2 ${
              selected ? "" : "border-border"
            }`}
            style={
              selected
                ? { borderTopColor: withAlpha(colors.accentForeground, 0.25) }
                : undefined
            }
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

/** The round icon button of both headers. `small` is the flat back-bar variant. */
export function RoundButton({
  icon,
  onPress,
  label,
  badge = false,
  small = false,
  disabled = false,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  badge?: boolean;
  /** The design's `.rnd.sm`: 38px, flat and transparent, used in back bars. */
  small?: boolean;
  /**
   * Holds the slot the design draws without pretending to work. Used where the
   * design shows an action we have no feature for yet: dimmed, unfocusable and
   * announced as disabled, so it never reads as a working control.
   */
  disabled?: boolean;
}) {
  const colors = useColors();
  const size = small ? 38 : 44;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      focusable={!disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{ width: size, height: size, opacity: disabled ? 0.35 : 1 }}
      className={`items-center justify-center rounded-full ${
        small ? "" : "bg-card shadow-sm shadow-black/5"
      }`}
    >
      <Icon name={icon} size={20} color={colors.foreground} />
      {badge ? (
        <View className="absolute right-3 top-[11px] h-[7px] w-[7px] rounded-full border-2 border-card bg-status-rose-fg" />
      ) : null}
    </Pressable>
  );
}

/**
 * "Guten Morgen," over the name, with the notification button — the design's
 * header on "Heute".
 */
export function GreetingHeader({
  greeting,
  name,
  onNotifications,
  notificationsLabel,
  hasUnread = false,
}: {
  greeting: string;
  name: string;
  onNotifications?: () => void;
  notificationsLabel: string;
  hasUnread?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1">
        <Text className="text-sm text-muted-foreground">{greeting}</Text>
        <Text
          numberOfLines={1}
          className="text-[21px] font-semibold tracking-tight text-foreground"
        >
          {name}
        </Text>
      </View>
      <RoundButton
        icon="bell"
        onPress={onNotifications}
        label={notificationsLabel}
        badge={hasUnread}
        // No notification screen exists yet; without a handler the bell holds
        // the design's slot rather than acting as a button that does nothing.
        disabled={!onNotifications}
      />
    </View>
  );
}

/**
 * The line under the greeting: today's date on the left, the place on the
 * right. The design names a building ("Schulhaus Seefeld"); we have no field
 * for one, so the caller passes the organization instead.
 */
export function DateLocationLine({
  date,
  location,
}: {
  date: string;
  location?: string | null;
}) {
  const colors = useColors();

  return (
    <View className="flex-row items-center gap-2.5">
      <Text
        numberOfLines={1}
        className="flex-1 text-[13px] font-medium text-foreground"
      >
        {date}
      </Text>
      {location ? (
        <View className="flex-row items-center gap-[7px] rounded-full bg-primary px-[15px] py-[9px]">
          <Icon name="pin" size={14} color={colors.primaryForeground} />
          <Text
            numberOfLines={1}
            className="max-w-[150px] text-[12.5px] font-semibold text-primary-foreground"
          >
            {location}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Back arrow, centred title, optional action — the header of "Verlauf" and the
 * day view. The right slot keeps its width even when empty so the title stays
 * centred.
 */
export function BackHeader({
  title,
  onBack,
  backLabel,
  action,
}: {
  title: string;
  onBack: () => void;
  backLabel: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <RoundButton icon="left" onPress={onBack} label={backLabel} small />
      <Text
        numberOfLines={1}
        className="flex-1 text-center text-[17px] font-semibold text-foreground"
      >
        {title}
      </Text>
      {action ?? <View style={{ width: 38, height: 38 }} />}
    </View>
  );
}
