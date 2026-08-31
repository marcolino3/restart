import {
  AbsenceDayPart,
  AbsenceEntryPrecision,
  allowedAbsenceEntryModes,
  absenceNoticeDayCount,
  absenceNoticeErrorCode,
  checkAbsenceNoticeDates,
  type AbsenceDayPartType,
  type AbsenceEntryModeType,
  type AbsenceNoticeCategoryRules,
} from "@restart/shared-schemas/employee-absences/absence-notice-rules";
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

import { DateField } from "@/components/DateField";
import {
  absenceCategoryName,
  createAbsenceNotice,
  fetchAbsenceCategories,
  fetchMyAbsenceCategoryQuota,
  type AbsenceCategory,
  type AbsenceCategoryQuota,
} from "@/lib/absences";
import { gqlErrorMessage } from "@/lib/time-tracking";
import { useColors } from "@/lib/theme";
import { i18n, t } from "@/lib/i18n";

const pad = (n: number) => n.toString().padStart(2, "0");

/** Date → local "YYYY-MM-DD". */
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (d: Date, days: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(
    i18n.locale === "de" ? "de-CH" : "en-GB",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );

/**
 * Self-service absence screen. A notice category is recorded at once and only
 * covers today or tomorrow; a request category may lie anywhere in the future
 * and waits for a decision by the team lead, HR or an admin. Ranges, the
 * per-request limit and the yearly quota follow the category settings; the
 * backend enforces the same rules.
 */
export default function AbsenceRequestModal() {
  const colors = useColors();
  const router = useRouter();

  const [categories, setCategories] = useState<AbsenceCategory[] | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(startOfToday());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [multiDay, setMultiDay] = useState(false);
  const [entryMode, setEntryMode] = useState<AbsenceEntryModeType>(
    AbsenceEntryPrecision.DAY,
  );
  const [dayPart, setDayPart] = useState<AbsenceDayPartType>(
    AbsenceDayPart.MORNING,
  );
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [isTeamInformed, setIsTeamInformed] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState<AbsenceCategoryQuota | null>(null);

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
  const entryPrecision = selected?.entryPrecision ?? AbsenceEntryPrecision.DAY;
  const rules: AbsenceNoticeCategoryRules = useMemo(
    () => ({
      requiresApproval: selected?.requiresApproval === true,
      allowsDateRange: selected?.allowsDateRange === true,
      entryPrecision,
      maxDaysPerRequest: selected?.maxDaysPerRequest ?? null,
      maxDaysAhead: selected?.maxDaysAhead ?? null,
    }),
    [selected, entryPrecision],
  );
  // The category's precision is the upper bound of what may be picked:
  // whole day, half day or a time of day.
  const entryModes = useMemo(
    () => allowedAbsenceEntryModes(entryPrecision),
    [entryPrecision],
  );
  const isHalfDay = entryMode === AbsenceEntryPrecision.HALF_DAY;
  const isTimeRange = entryMode === AbsenceEntryPrecision.TIME;
  // Several days are opt-in and only for whole-day entries.
  const canUseRange =
    rules.allowsDateRange === true && entryMode === AbsenceEntryPrecision.DAY;
  const useRange = canUseRange && multiDay;

  // Clear whatever the active mode does not use.
  useEffect(() => {
    if (!entryModes.includes(entryMode))
      setEntryMode(AbsenceEntryPrecision.DAY);
    if (!canUseRange) setMultiDay(false);
    if (!useRange) setEndDate(null);
    if (!isTimeRange) {
      setStartTime(null);
      setEndTime(null);
    }
  }, [entryModes, entryMode, canUseRange, useRange, isTimeRange]);

  // Remaining yearly allowance, only for capped categories.
  useEffect(() => {
    if (!selected || selected.maxDaysPerYear == null) {
      setQuota(null);
      return;
    }
    let cancelled = false;
    fetchMyAbsenceCategoryQuota(
      selected.id,
      startDate ? toDateStr(startDate) : undefined,
    )
      .then((data) => {
        if (!cancelled) setQuota(data);
      })
      .catch(() => {
        if (!cancelled) setQuota(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, startDate]);

  const today = startOfToday();
  const startMax =
    rules.maxDaysAhead != null ? addDays(today, rules.maxDaysAhead) : undefined;
  const endMin = startDate ?? today;
  const endMax =
    startDate && rules.maxDaysPerRequest != null
      ? addDays(startDate, rules.maxDaysPerRequest - 1)
      : undefined;

  const requestedDays = startDate
    ? absenceNoticeDayCount(startDate, endDate)
    : 0;
  const quotaExhausted =
    quota?.remainingDays != null && quota.remainingDays < requestedDays;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!categoryId) {
      next.category = t("Employees.validationError");
    }
    if (!startDate) {
      next.startDate = t("TimeTracking.invalidDate");
    } else {
      const issue = checkAbsenceNoticeDates(
        {
          startDate,
          endDate,
          entryMode,
          dayPart: isHalfDay ? dayPart : AbsenceDayPart.FULL,
          startTime: startTime ? toTimeStr(startTime) : null,
          endTime: endTime ? toTimeStr(endTime) : null,
        },
        rules,
      );
      if (issue) {
        next[issue.field] = t(`Employees.absence.dateError.${issue.code}`, {
          days: rules.maxDaysAhead ?? 0,
        });
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate() || !startDate) return;
    setBusy(true);
    try {
      const result = await createAbsenceNotice({
        startDate: toDateStr(startDate),
        endDate: useRange && endDate ? toDateStr(endDate) : null,
        absenceCategoryId: categoryId,
        note: note.trim(),
        isTeamInformed,
        dayPart: isHalfDay ? dayPart : AbsenceDayPart.FULL,
        startTime: isTimeRange && startTime ? toTimeStr(startTime) : null,
        endTime: isTimeRange && endTime ? toTimeStr(endTime) : null,
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
      const message = gqlErrorMessage(e);
      const mapped = absenceNoticeErrorCode(message);
      if (mapped) {
        setErrors({
          [mapped.field]: t(`Employees.absence.dateError.${mapped.code}`, {
            days: rules.maxDaysAhead ?? 0,
          }),
        });
      } else {
        Alert.alert(t("Common.error"), message);
      }
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
              <View
                className={`gap-0.5 rounded-md px-3 py-2 ${
                  rules.requiresApproval
                    ? "bg-status-amber-bg"
                    : "bg-status-sky-bg"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    rules.requiresApproval
                      ? "text-status-amber-fg"
                      : "text-status-sky-fg"
                  }`}
                >
                  {rules.requiresApproval
                    ? t("Employees.absence.requiresApprovalTitle")
                    : t("Employees.absence.noticeOnlyTitle")}
                </Text>
                <Text
                  className={`text-xs ${
                    rules.requiresApproval
                      ? "text-status-amber-fg"
                      : "text-status-sky-fg"
                  }`}
                >
                  {rules.requiresApproval
                    ? t("Employees.absence.requiresApprovalHint")
                    : t("Employees.absence.noticeOnlyHint")}
                  {rules.maxDaysAhead != null
                    ? " " +
                      (rules.maxDaysAhead <= 1
                        ? t("Employees.absence.daysAheadTomorrow")
                        : t("Employees.absence.daysAheadHint", {
                            days: rules.maxDaysAhead,
                          }))
                    : null}
                </Text>
              </View>
            ) : null}
            {quota && quota.maxDaysPerYear != null ? (
              <Text
                className={`text-xs ${
                  quotaExhausted ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {quota.remainingDays === 0
                  ? t("Employees.absence.quotaExhausted", {
                      max: quota.maxDaysPerYear,
                      periodEnd: formatDate(quota.periodEnd),
                    })
                  : t("Employees.absence.quotaHint", {
                      remaining: quota.remainingDays ?? 0,
                      max: quota.maxDaysPerYear,
                      periodEnd: formatDate(quota.periodEnd),
                    })}
              </Text>
            ) : null}
          </View>

          {entryModes.length > 1 ? (
            <Segment
              value={entryMode}
              onChange={setEntryMode}
              options={entryModes.map((value) => ({
                value,
                label: t(`Employees.absence.entryMode.${value}`),
              }))}
            />
          ) : null}

          {canUseRange ? (
            <Segment
              value={multiDay ? "multi" : "single"}
              onChange={(v) => setMultiDay(v === "multi")}
              options={[
                { value: "single", label: t("Employees.absence.singleDay") },
                { value: "multi", label: t("Employees.absence.multiDay") },
              ]}
            />
          ) : null}

          <DateField
            label={useRange ? t("Common.startDate") : t("Common.date")}
            value={startDate}
            onChange={(d) => {
              setStartDate(d);
              if (d && endDate && endDate < d) setEndDate(null);
            }}
            minimumDate={today}
            maximumDate={startMax}
            error={errors.startDate}
          />

          {useRange ? (
            <DateField
              label={t("Common.endDate")}
              value={endDate}
              onChange={setEndDate}
              minimumDate={endMin}
              maximumDate={endMax}
              optional
              error={errors.endDate}
            />
          ) : null}

          {isHalfDay ? (
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">
                {t("Employees.absence.dayPartLabel")}
              </Text>
              <Segment
                value={dayPart}
                onChange={setDayPart}
                options={(
                  [AbsenceDayPart.MORNING, AbsenceDayPart.AFTERNOON] as const
                ).map((value) => ({
                  value,
                  label: t(`Employees.absence.dayPart.${value}`),
                }))}
              />
            </View>
          ) : null}

          {isTimeRange ? (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DateField
                  mode="time"
                  label={t("Common.startTime")}
                  value={startTime}
                  onChange={setStartTime}
                  error={errors.startTime}
                />
              </View>
              <View className="flex-1">
                <DateField
                  mode="time"
                  label={t("Common.endTime")}
                  value={endTime}
                  onChange={setEndTime}
                  optional
                  error={errors.endTime}
                />
              </View>
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

const toTimeStr = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** Pill switch for 2–3 exclusive choices (single/several days, day part). */
function Segment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <View className="flex-row rounded-md bg-muted p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            className={`flex-1 items-center rounded-sm px-3 py-1.5 ${
              active ? "bg-background" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
