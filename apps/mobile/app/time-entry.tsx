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
import {
  createEntry,
  deleteEntry,
  gqlErrorMessage,
  updateEntry,
} from "@/lib/time-tracking";
import { t } from "@/lib/i18n";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

const pad = (n: number) => n.toString().padStart(2, "0");

/** Date → local "YYYY-MM-DD". */
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Date → local "HH:MM". */
const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Local "YYYY-MM-DD" + "HH:MM" → Date (local timezone). */
const toDate = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
};

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "numbers-and-punctuation";
  multiline?: boolean;
  maxLength?: number;
  error?: string | null;
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  maxLength,
  error,
}: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
        className={`rounded-md border bg-background px-3 py-2.5 text-base text-foreground ${
          error ? "border-destructive" : "border-border"
        } ${multiline ? "min-h-20" : ""}`}
        placeholderTextColor="#9ca3af"
      />
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

export default function TimeEntryModal() {
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
  const initialEnd = params.endedAt ? new Date(params.endedAt) : null;

  const [date, setDate] = useState(
    initialStart ? toDateStr(initialStart) : toDateStr(new Date()),
  );
  const [startTime, setStartTime] = useState(
    initialStart ? toTimeStr(initialStart) : "",
  );
  const [endTime, setEndTime] = useState(
    initialEnd ? toTimeStr(initialEnd) : "",
  );
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
    if (!DATE_RE.test(date) || Number.isNaN(toDate(date, "00:00").getTime())) {
      next.date = t("TimeTracking.invalidDate");
    }
    if (!TIME_RE.test(startTime)) {
      next.startTime = t("TimeTracking.invalidTime");
    }
    if (!TIME_RE.test(endTime)) {
      next.endTime = t("TimeTracking.invalidTime");
    }
    if (!next.date && !next.startTime && !next.endTime) {
      if (toDate(date, endTime) <= toDate(date, startTime)) {
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
    if (notes.length > 255) {
      next.notes = t("TimeTracking.noteTooLong");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const startedAt = toDate(date, startTime).toISOString();
      const endedAt = toDate(date, endTime).toISOString();
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-5 p-5"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">
              {isEdit
                ? t("TimeTracking.editEntry")
                : t("TimeTracking.addEntry")}
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="text-base text-muted-foreground">
                {t("Common.cancel")}
              </Text>
            </Pressable>
          </View>

          <FormField
            label={t("TimeTracking.date")}
            value={date}
            onChangeText={setDate}
            placeholder="2026-01-31"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            error={errors.date}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormField
                label={t("TimeTracking.startTime")}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="08:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                error={errors.startTime}
              />
            </View>
            <View className="flex-1">
              <FormField
                label={t("TimeTracking.endTime")}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="17:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                error={errors.endTime}
              />
            </View>
          </View>

          <FormField
            label={t("TimeTracking.breakMinutes")}
            value={breakMin}
            onChangeText={setBreakMin}
            placeholder="30"
            keyboardType="numeric"
            maxLength={4}
            error={errors.breakMin}
          />

          <FormField
            label={t("TimeTracking.note")}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={255}
            error={errors.notes}
          />

          <Pressable
            onPress={save}
            disabled={busy}
            className={`items-center rounded-md bg-primary px-4 py-4 ${
              busy ? "opacity-60" : ""
            }`}
          >
            <Text className="text-base font-semibold text-primary-foreground">
              {t("TimeTracking.saveEntry")}
            </Text>
          </Pressable>

          {isEdit ? (
            <Pressable
              onPress={confirmDelete}
              disabled={busy}
              className={`items-center rounded-md border border-destructive px-4 py-4 ${
                busy ? "opacity-60" : ""
              }`}
            >
              <Text className="text-base font-semibold text-destructive">
                {t("TimeTracking.deleteEntry")}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
