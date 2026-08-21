/**
 * Web counterpart of `DateTimeField.tsx`.
 *
 * `@react-native-community/datetimepicker` ships no web implementation, so the
 * browser gets `<input type="date">` and `<input type="time">` — which bring
 * their own picker — styled to match the design's soft fields. Metro resolves
 * this file for the web bundle and the native one everywhere else.
 */
import React from "react";
import { Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { formatDayLong } from "./date-utils";
import { useColors } from "@/lib/theme";
import { Icon } from "./Icon";
import { PickRow, TimeValue } from "./sheet-ui";


/** The bare input, sized to cover the field so the whole row is clickable. */
const inputStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  border: "none",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  // Safari needs an explicit size or the invisible input collapses.
  fontSize: 16,
};

function FieldShell({
  icon,
  caption,
  value,
  error,
  input,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  caption: string;
  value: string;
  error?: string | null;
  input: React.ReactNode;
}) {
  const colors = useColors();

  return (
    <View className="gap-1.5">
      <View
        className={`flex-row items-center gap-3 rounded-lg bg-field px-4 py-3 ${
          error ? "border border-destructive" : ""
        }`}
      >
        <FontAwesome name={icon} size={17} color={colors.mutedForeground} />
        <View className="flex-1">
          <Text className="text-[12.5px] text-muted-foreground">{caption}</Text>
          <Text className="text-[15px] font-semibold text-foreground">
            {value}
          </Text>
        </View>
        {input}
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: string | null;
}) {
  return (
    <FieldShell
      icon="calendar"
      caption={label}
      value={value ? formatDayLong(value) : "–"}
      error={error}
      input={
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          style={inputStyle}
        />
      }
    />
  );
}

/**
 * The date row of the capture sheet — the design's `.pick` shape with the
 * calendar glyph trailing instead of a chevron, as opposed to the soft
 * `DateField` used in forms.
 */
export function DateCard({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: string | null;
}) {
  const colors = useColors();

  return (
    <View className="gap-1.5">
      <View className="relative">
        <PickRow
          caption={label}
          value={value ? formatDayLong(value) : "–"}
          trailing={<Icon name="calendar" size={18} color={colors.mutedForeground} />}
        />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          style={inputStyle}
        />
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

/**
 * The large time inside the capture sheet's span card. Same picker as
 * `TimeField`, but drawn as the design's `.frow2 .fv` rather than a field row.
 */
export function TimeValueField({
  label,
  value,
  onChange,
  active = false,
  onFocus,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
  active?: boolean;
  onFocus?: () => void;
}) {
  return (
    <View className="relative flex-1">
      <TimeValue caption={label} value={value || "–"} active={active} />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        aria-label={label}
        style={inputStyle}
      />
    </View>
  );
}

export function TimeField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  /** Kept for API parity with the native field, unused on web. */
  date?: string;
  value: string;
  onChange: (time: string) => void;
  error?: string | null;
}) {
  return (
    <FieldShell
      icon="clock-o"
      caption={label}
      value={value || "–"}
      error={error}
      input={
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          style={inputStyle}
        />
      }
    />
  );
}
