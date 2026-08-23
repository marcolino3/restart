import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

import {
  absenceCategoryName,
  createAbsenceNotice,
  fetchAbsenceCategories,
  type AbsenceCategory,
} from "@/lib/absences";
import { gqlErrorMessage } from "@/lib/time-tracking";
import { useColors } from "@/lib/theme";
import { i18n, t } from "@/lib/i18n";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => n.toString().padStart(2, "0");

/** Date → local "YYYY-MM-DD". */
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfDay = (value: string) => {
  const d = new Date(`${value}T00:00:00`);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Self-service absence screen. A notice category is recorded at once and only
 * covers today or tomorrow; a request category may lie anywhere in the future
 * and waits for a decision by the team lead, HR or an admin.
 */
export default function AbsenceRequestModal() {
  const colors = useColors();
  const router = useRouter();

  const [categories, setCategories] = useState<AbsenceCategory[] | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState(toDateStr(new Date()));
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [isTeamInformed, setIsTeamInformed] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAbsenceCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setCategories([]);
          Alert.alert(t("Common.error"), gqlErrorMessage(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => categories?.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );
  const requiresApproval = selected?.requiresApproval === true;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!categoryId) {
      next.category = t("Employees.validationError");
    }
    if (!DATE_RE.test(startDate) || Number.isNaN(new Date(startDate).getTime())) {
      next.startDate = t("TimeTracking.invalidDate");
    } else {
      const start = startOfDay(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        next.startDate = t("Employees.absence.dateError.past");
      } else if (!requiresApproval) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (start > tomorrow) {
          next.startDate = t("Employees.absence.dateError.tooFar");
        }
      }
    }
    if (endDate) {
      if (!DATE_RE.test(endDate)) {
        next.endDate = t("TimeTracking.invalidDate");
      } else if (
        !next.startDate &&
        startOfDay(endDate) < startOfDay(startDate)
      ) {
        next.endDate = t("Employees.absence.dateError.endBeforeStart");
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const result = await createAbsenceNotice({
        startDate,
        endDate: endDate || null,
        absenceCategoryId: categoryId,
        note: note.trim(),
        isTeamInformed,
      });
      if (result.status === "PENDING") {
        Alert.alert(
          t("Common.createAbsenceNotice"),
          t("Employees.absence.requestSubmitted"),
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
              {t("Common.createAbsenceNotice")}
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="text-base text-muted-foreground">
                {t("Common.cancel")}
              </Text>
            </Pressable>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              {t("Common.absenceCategories")}
            </Text>
            {categories === null ? (
              <ActivityIndicator color={colors.foreground} />
            ) : (
              <View className="gap-2">
                {categories.map((category) => {
                  const active = category.id === categoryId;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setCategoryId(category.id)}
                      className={`rounded-md border p-3 ${
                        active
                          ? "border-primary bg-card"
                          : "border-border bg-background"
                      }`}
                    >
                      <Text className="text-sm font-medium text-foreground">
                        {absenceCategoryName(category, i18n.locale)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {errors.category ? (
              <Text className="text-xs text-destructive">
                {errors.category}
              </Text>
            ) : null}
            {selected ? (
              <Text className="text-xs text-muted-foreground">
                {requiresApproval
                  ? t("Employees.absence.requiresApprovalHint")
                  : t("Employees.absence.noticeOnlyHint")}
              </Text>
            ) : null}
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              {t("Common.startDate")}
            </Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-01-31"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              autoCapitalize="none"
              autoCorrect={false}
              className={`rounded-md border bg-background px-3 py-2.5 text-base text-foreground ${
                errors.startDate ? "border-destructive" : "border-border"
              }`}
              placeholderTextColor={colors.mutedForeground}
            />
            {errors.startDate ? (
              <Text className="text-xs text-destructive">
                {errors.startDate}
              </Text>
            ) : null}
          </View>

          {requiresApproval ? (
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">
                {t("Common.endDate")}
              </Text>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="2026-02-03"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                autoCapitalize="none"
                autoCorrect={false}
                className={`rounded-md border bg-background px-3 py-2.5 text-base text-foreground ${
                  errors.endDate ? "border-destructive" : "border-border"
                }`}
                placeholderTextColor={colors.mutedForeground}
              />
              {errors.endDate ? (
                <Text className="text-xs text-destructive">
                  {errors.endDate}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              {t("Common.note")}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={500}
              className="min-h-20 rounded-md border border-border bg-background px-3 py-2.5 text-base text-foreground"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          <View className="flex-row items-center justify-between rounded-md border border-border p-3">
            <Text className="flex-1 pr-3 text-sm font-medium text-foreground">
              {t("Common.isTeamInformed")}
            </Text>
            <Switch value={isTeamInformed} onValueChange={setIsTeamInformed} />
          </View>

          <Pressable
            onPress={save}
            disabled={busy}
            className={`items-center rounded-md bg-primary px-4 py-4 ${
              busy ? "opacity-60" : ""
            }`}
          >
            <Text className="text-base font-semibold text-primary-foreground">
              {t("Common.create")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
