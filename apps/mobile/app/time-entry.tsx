/**
 * "Tagesansicht" — one day, editable.
 *
 * The design's third screen, minus the multi-block timeline: the backend
 * allows exactly one entry per day (`assertNoDuplicateForDay`), so a day is
 * one arrival, one departure, one break and a note. The green band at the top
 * shows the recorded span and the resulting total.
 */
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import {
  createEntry,
  deleteEntry,
  formatDuration,
  gqlErrorMessage,
  updateEntry,
} from "@/lib/time-tracking";
import { DateField, TimeField } from "@/features/time-tracking/DateTimeField";
import {
  combineDateTime,
  formatDayLong,
  timeValue,
  toEntryDate,
  todayEntryDate,
} from "@/features/time-tracking/date-utils";
import { t } from "@/lib/i18n";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ACCENT_INK = "#ffffff";

/** Worked minutes for the values currently in the form, or null if incomplete. */
const previewMinutes = (
  date: string,
  start: string,
  end: string,
  breakMin: string,
): number | null => {
  if (!DATE_RE.test(date) || !TIME_RE.test(start) || !TIME_RE.test(end)) {
    return null;
  }
  const from = new Date(combineDateTime(date, start)).getTime();
  const to = new Date(combineDateTime(date, end)).getTime();
  if (to <= from) return null;
  const gross = Math.round((to - from) / 60000);
  const pause = Number(breakMin);
  return gross - (Number.isInteger(pause) && pause > 0 ? pause : 0);
};

export default function TimeEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    employeeId?: string;
    startedAt?: string;
    endedAt?: string;
    breakMinutes?: string;
    notes?: string;
  }>();

  const isEdit = Boolean(params.id);
  const initialStart = params.startedAt ? new Date(params.startedAt) : null;

  const [date, setDate] = useState(
    initialStart ? toEntryDate(initialStart) : todayEntryDate(),
  );
  const [startTime, setStartTime] = useState(timeValue(params.startedAt));
  const [endTime, setEndTime] = useState(timeValue(params.endedAt));
  const [breakMin, setBreakMin] = useState(
    params.breakMinutes != null && params.breakMinutes !== ""
      ? String(params.breakMinutes)
      : "30",
  );
  const [notes, setNotes] = useState(params.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!DATE_RE.test(date)) next.date = t("TimeTracking.invalidDate");
    if (!TIME_RE.test(startTime)) next.startTime = t("TimeTracking.invalidTime");
    if (!TIME_RE.test(endTime)) next.endTime = t("TimeTracking.invalidTime");
    if (!next.date && !next.startTime && !next.endTime) {
      if (
        new Date(combineDateTime(date, endTime)) <=
        new Date(combineDateTime(date, startTime))
      ) {
        next.endTime = t("TimeTracking.endBeforeStart");
      }
    }
    const breakValue = Number(breakMin);
    if (
      breakMin.trim() === "" ||
      !Number.isInteger(breakValue) ||
      breakValue < 0
    ) {
      next.breakMin = t("TimeTracking.invalidBreak");
    }
    if (notes.length > 255) next.notes = t("TimeTracking.noteTooLong");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const startedAt = combineDateTime(date, startTime);
      const endedAt = combineDateTime(date, endTime);
      const breakMinutes = Number(breakMin);
      const trimmedNotes = notes.trim();
      if (isEdit && params.id) {
        await updateEntry({
          id: params.id,
          startedAt,
          endedAt,
          breakMinutes,
          notes: trimmedNotes || null,
        });
      } else {
        if (!params.employeeId) return;
        await createEntry({
          employeeId: params.employeeId,
          startedAt,
          endedAt,
          breakMinutes,
          notes: trimmedNotes || null,
        });
      }
      router.back();
    } catch (e) {
      Alert.alert(t("Common.error"), gqlErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    if (!params.id) return;
    Alert.alert(
      t("TimeTracking.deleteEntry"),
      t("TimeTracking.deleteEntryConfirm"),
      [
        { text: t("Common.cancel"), style: "cancel" },
        {
          text: t("Common.delete"),
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await deleteEntry(params.id!);
              router.back();
            } catch (e) {
              Alert.alert(t("Common.error"), gqlErrorMessage(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const minutes = previewMinutes(date, startTime, endTime, breakMin);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 p-5"
        >
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="h-[38px] w-[38px] items-center justify-center rounded-full"
              accessibilityRole="button"
              accessibilityLabel={t("Common.cancel")}
            >
              <FontAwesome name="chevron-left" size={17} color="#26251f" />
            </Pressable>
            <Text className="flex-1 text-center text-[17px] font-semibold text-foreground">
              {DATE_RE.test(date)
                ? formatDayLong(date)
                : t("TimeTracking.addEntry")}
            </Text>
            <View className="h-[38px] w-[38px]" />
          </View>

          {/* The design's green day header: recorded span left, total right. */}
          <View className="flex-row items-center gap-4 rounded-band bg-primary p-[18px]">
            <View className="flex-1">
              <Text className="text-[12.5px] text-primary-foreground/80">
                {t("TimeTracking.worked")}
              </Text>
              <Text className="mt-0.5 text-lg font-semibold text-primary-foreground">
                {startTime || "–"} – {endTime || "–"}
              </Text>
            </View>
            <View className="items-end">
              <Text className="font-mono-bold text-[27px] text-primary-foreground">
                {minutes != null ? formatDuration(minutes) : "–"}
              </Text>
              <Text className="text-[11.5px] text-primary-foreground/80">
                {t("TimeTracking.break")} {breakMin || "0"}′
              </Text>
            </View>
          </View>

          <DateField
            label={t("TimeTracking.date")}
            value={date}
            onChange={setDate}
            error={errors.date}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TimeField
                label={t("TimeTracking.startTime")}
                date={date}
                value={startTime}
                onChange={setStartTime}
                error={errors.startTime}
              />
            </View>
            <View className="flex-1">
              <TimeField
                label={t("TimeTracking.endTime")}
                date={date}
                value={endTime}
                onChange={setEndTime}
                error={errors.endTime}
              />
            </View>
          </View>

          <View className="gap-1.5">
            <View className="flex-row items-center gap-3 rounded-lg bg-field px-4 py-3">
              <FontAwesome name="coffee" size={16} color="#837d70" />
              <View className="flex-1">
                <Text className="text-[12.5px] text-muted-foreground">
                  {t("TimeTracking.breakMinutes")}
                </Text>
                <TextInput
                  value={breakMin}
                  onChangeText={setBreakMin}
                  keyboardType="numeric"
                  maxLength={4}
                  className="p-0 text-[15px] font-semibold text-foreground"
                  placeholderTextColor="#837d70"
                />
              </View>
            </View>
            {errors.breakMin ? (
              <Text className="text-xs text-destructive">
                {errors.breakMin}
              </Text>
            ) : null}
          </View>

          <View className="gap-1.5">
            <View className="gap-1.5 rounded-lg bg-field px-4 py-3">
              <Text className="text-[12.5px] text-muted-foreground">
                {t("TimeTracking.note")}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={255}
                className="min-h-16 p-0 text-[15px] text-foreground"
                placeholderTextColor="#837d70"
              />
            </View>
            {errors.notes ? (
              <Text className="text-xs text-destructive">{errors.notes}</Text>
            ) : null}
          </View>

          <Pressable
            onPress={save}
            disabled={busy}
            className={`flex-row items-center justify-center gap-2 rounded-lg bg-primary p-3.5 ${
              busy ? "opacity-60" : ""
            }`}
          >
            <FontAwesome name="check" size={16} color={ACCENT_INK} />
            <Text className="text-sm font-semibold text-primary-foreground">
              {t("TimeTracking.saveEntry")}
            </Text>
          </Pressable>

          {isEdit ? (
            <Pressable
              onPress={confirmDelete}
              disabled={busy}
              className={`flex-row items-center justify-center gap-2 rounded-lg border border-border bg-card p-3.5 ${
                busy ? "opacity-60" : ""
              }`}
            >
              <FontAwesome name="trash-o" size={16} color="#a3452e" />
              <Text className="text-sm font-semibold text-destructive">
                {t("TimeTracking.deleteEntry")}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
