/**
 * Date and time fields in the design's soft-field style: an icon on the left,
 * a small caption above the value, tapping opens the native picker.
 *
 * `@react-native-community/datetimepicker` has no web implementation, so the
 * web bundle gets `DateTimeField.web.tsx` with native inputs instead.
 */
import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { combineDateTime, formatDayLong, parseEntryDate } from "./date-utils";
import { useColors } from "@/lib/theme";
import { Icon } from "./Icon";
import { PickRow, TimeValue } from "./sheet-ui";


/** The shared shell: icon, caption, value, and the error line below it. */
function FieldShell({
  icon,
  caption,
  value,
  error,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  caption: string;
  value: string;
  error?: string | null;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <View className="gap-1.5">
      <Pressable
        onPress={onPress}
        className={`flex-row items-center gap-3 rounded-lg bg-field px-4 py-3 ${
          error ? "border border-destructive" : ""
        }`}
      >
        <FontAwesome
          name={icon}
          size={17}
          color={error ? colors.destructive : colors.mutedForeground}
        />
        <View className="flex-1">
          <Text className="text-[12.5px] text-muted-foreground">{caption}</Text>
          <Text className="text-[15px] font-semibold text-foreground">
            {value}
          </Text>
        </View>
      </Pressable>
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
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (date: string) => void;
  error?: string | null;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <FieldShell
        icon="calendar"
        caption={label}
        value={value ? formatDayLong(value) : "–"}
        error={error}
        onPress={() => setOpen(true)}
      />
      {open ? (
        <DateTimePicker
          mode="date"
          value={value ? parseEntryDate(value) : new Date()}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, picked) => {
            // Android fires once and dismisses itself; iOS keeps the inline
            // picker open until the user leaves the field.
            if (Platform.OS !== "ios") setOpen(false);
            if (event.type === "dismissed" || !picked) return;
            onChange(
              `${picked.getFullYear()}-${String(picked.getMonth() + 1).padStart(
                2,
                "0",
              )}-${String(picked.getDate()).padStart(2, "0")}`,
            );
          }}
        />
      ) : null}
    </>
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
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (date: string) => void;
  error?: string | null;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <View className="gap-1.5">
        <PickRow
          caption={label}
          value={value ? formatDayLong(value) : "–"}
          trailing={<Icon name="calendar" size={18} color={colors.mutedForeground} />}
          onPress={() => setOpen(true)}
        />
        {error ? (
          <Text className="text-xs text-destructive">{error}</Text>
        ) : null}
      </View>
      {open ? (
        <DateTimePicker
          mode="date"
          value={value ? parseEntryDate(value) : new Date()}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, picked) => {
            if (Platform.OS !== "ios") setOpen(false);
            if (event.type === "dismissed" || !picked) return;
            onChange(
              `${picked.getFullYear()}-${String(picked.getMonth() + 1).padStart(
                2,
                "0",
              )}-${String(picked.getDate()).padStart(2, "0")}`,
            );
          }}
        />
      ) : null}
    </>
  );
}

/**
 * The large time inside the capture sheet's span card. Same picker as
 * `TimeField`, but drawn as the design's `.frow2 .fv` rather than a field row.
 */
export function TimeValueField({
  label,
  date,
  value,
  onChange,
  active = false,
  onFocus,
}: {
  label: string;
  date: string;
  value: string;
  onChange: (time: string) => void;
  active?: boolean;
  onFocus?: () => void;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TimeValue
        caption={label}
        value={value || "–"}
        active={active}
        onPress={() => {
          onFocus?.();
          setOpen(true);
        }}
      />
      {open ? (
        <DateTimePicker
          mode="time"
          is24Hour
          value={
            value && date ? new Date(combineDateTime(date, value)) : new Date()
          }
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, picked) => {
            if (Platform.OS !== "ios") setOpen(false);
            if (event.type === "dismissed" || !picked) return;
            onChange(
              `${String(picked.getHours()).padStart(2, "0")}:${String(
                picked.getMinutes(),
              ).padStart(2, "0")}`,
            );
          }}
        />
      ) : null}
    </>
  );
}

export function TimeField({
  label,
  /** `YYYY-MM-DD`, the day the time belongs to. */
  date,
  /** `HH:MM`, empty when unset. */
  value,
  onChange,
  error,
}: {
  label: string;
  date: string;
  value: string;
  onChange: (time: string) => void;
  error?: string | null;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <FieldShell
        icon="clock-o"
        caption={label}
        value={value || "–"}
        error={error}
        onPress={() => setOpen(true)}
      />
      {open ? (
        <DateTimePicker
          mode="time"
          is24Hour
          value={
            value && date ? new Date(combineDateTime(date, value)) : new Date()
          }
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, picked) => {
            if (Platform.OS !== "ios") setOpen(false);
            if (event.type === "dismissed" || !picked) return;
            onChange(
              `${String(picked.getHours()).padStart(2, "0")}:${String(
                picked.getMinutes(),
              ).padStart(2, "0")}`,
            );
          }}
        />
      ) : null}
    </>
  );
}
