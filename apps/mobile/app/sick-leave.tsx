import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { reportSickLeave } from "@/lib/sick-leave";
import { gqlErrorMessage } from "@/lib/time-tracking";
import { useColors } from "@/lib/theme";
import { t } from "@/lib/i18n";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const pad = (n: number) => n.toString().padStart(2, "0");

/** Date → local "YYYY-MM-DD". */
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function SickLeaveModal() {
  const colors = useColors();
  const router = useRouter();

  const [date, setDate] = useState(toDateStr(new Date()));
  const [hasStartTime, setHasStartTime] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!DATE_RE.test(date) || Number.isNaN(new Date(date).getTime())) {
      next.date = t("TimeTracking.invalidDate");
    }
    if (hasStartTime && !TIME_RE.test(startTime)) {
      next.startTime = t("SickLeave.invalidTime");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const trimmed = comment.trim();
      const result = await reportSickLeave({
        date,
        // Only send a time when the user explicitly picked one — an absent
        // time means the whole day.
        startTime: hasStartTime ? startTime : null,
        comment: trimmed || null,
      });
      if (result.isUnchanged) {
        // The day was already covered: nothing was written and nobody was
        // notified, so leaving silently would look like a successful report.
        Alert.alert(
          t("SickLeave.reportAlreadyExistsTitle"),
          t("SickLeave.reportAlreadyExists"),
          [{ text: t("Common.ok"), onPress: () => router.back() }],
        );
        return;
      }
      router.back();
    } catch (e) {
      Alert.alert(t("Common.error"), gqlErrorMessage(e));
    } finally {
      setBusy(false);
    }
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
              {t("SickLeave.title")}
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="text-base text-muted-foreground">
                {t("Common.cancel")}
              </Text>
            </Pressable>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              {t("TimeTracking.date")}
            </Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="2026-01-31"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              autoCapitalize="none"
              autoCorrect={false}
              className={`rounded-md border bg-background px-3 py-2.5 text-base text-foreground ${
                errors.date ? "border-destructive" : "border-border"
              }`}
              placeholderTextColor={colors.mutedForeground}
            />
            {errors.date ? (
              <Text className="text-xs text-destructive">{errors.date}</Text>
            ) : null}
          </View>

          <View className="flex-row items-center justify-between rounded-md border border-border p-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-medium text-foreground">
                {t("SickLeave.hasStartTime")}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {t("SickLeave.startTimeDescription")}
              </Text>
            </View>
            <Switch value={hasStartTime} onValueChange={setHasStartTime} />
          </View>

          {hasStartTime ? (
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">
                {t("SickLeave.startTime")}
              </Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="13:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                autoCapitalize="none"
                autoCorrect={false}
                className={`rounded-md border bg-background px-3 py-2.5 text-base text-foreground ${
                  errors.startTime ? "border-destructive" : "border-border"
                }`}
                placeholderTextColor={colors.mutedForeground}
              />
              {errors.startTime ? (
                <Text className="text-xs text-destructive">
                  {errors.startTime}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              {t("SickLeave.comment")}
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
              className="min-h-20 rounded-md border border-border bg-background px-3 py-2.5 text-base text-foreground"
              placeholderTextColor={colors.mutedForeground}
            />
            <Text className="text-xs text-muted-foreground">
              {t("SickLeave.commentDescription")}
            </Text>
          </View>

          <Pressable
            onPress={save}
            disabled={busy}
            className={`items-center rounded-md bg-primary px-4 py-4 ${
              busy ? "opacity-60" : ""
            }`}
          >
            <Text className="text-base font-semibold text-primary-foreground">
              {t("SickLeave.title")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
