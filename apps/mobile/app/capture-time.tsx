/**
 * "Arbeitszeit erfassen" — screen 4 of the design: entering a day by hand.
 *
 * The design shows two fields the backend has no column for, activity and
 * class/project. Both are drawn as the design draws them but disabled, so the
 * screen matches the mockup without offering a control that cannot be saved.
 * Everything else — date, span, break, note — maps onto `createEntry`.
 */
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createEntry,
  fetchMyTimeTracking,
  formatDuration,
  gqlErrorMessage,
} from "@/lib/time-tracking";
import {
  DateCard,
  TimeValueField,
} from "@/features/time-tracking/DateTimeField";
import { Icon, type IconName } from "@/features/time-tracking/Icon";
import { useColors } from "@/lib/theme";
import {
  CardTotal,
  CategoryTile,
  FieldCard,
  FieldLabel,
  PickRow,
  QuickPill,
  SheetFooter,
  SheetHeader,
  Stepper,
  TimeArrow,
} from "@/features/time-tracking/sheet-ui";
import {
  combineDateTime,
  todayEntryDate,
} from "@/features/time-tracking/date-utils";
import { t } from "@/lib/i18n";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;


/** The break stepper moves in the quarter-hour steps the design labels. */
const BREAK_STEP = 15;
const BREAK_MAX = 480;

/** Worked minutes for the current form values, or null while incomplete. */
const previewMinutes = (
  date: string,
  start: string,
  end: string,
  breakMinutes: number,
): number | null => {
  if (!DATE_RE.test(date) || !TIME_RE.test(start) || !TIME_RE.test(end)) {
    return null;
  }
  const from = new Date(combineDateTime(date, start)).getTime();
  const to = new Date(combineDateTime(date, end)).getTime();
  if (to <= from) return null;
  return Math.round((to - from) / 60000) - breakMinutes;
};

/** The quick-fill pills. Each one sets the whole span at once. */
const QUICK_SPANS: { key: string; label: () => string; span: [string, string] }[] =
  [
    {
      key: "fullDay",
      label: () => t("TimeTracking.quickFullDay"),
      span: ["08:00", "17:00"],
    },
    {
      key: "morning",
      label: () => t("TimeTracking.quickMorning"),
      span: ["08:00", "12:00"],
    },
    {
      key: "afternoon",
      label: () => t("TimeTracking.quickAfternoon"),
      span: ["13:00", "17:00"],
    },
  ];

/**
 * The activity tiles. No column backs them yet, so they render as the design
 * draws them but stay disabled — see the file header.
 */
const ACTIVITIES: {
  key: string;
  icon: IconName;
  label: () => string;
}[] = [
  { key: "lesson", icon: "clock", label: () => t("TimeTracking.activityLesson") },
  {
    key: "preparation",
    icon: "note",
    label: () => t("TimeTracking.activityPreparation"),
  },
  { key: "meeting", icon: "sum", label: () => t("TimeTracking.activityMeeting") },
  {
    key: "event",
    icon: "calendar",
    label: () => t("TimeTracking.activityEvent"),
  },
];

export default function CaptureTimeScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ employeeId?: string; date?: string }>();

  const [date, setDate] = useState(
    params.date && DATE_RE.test(params.date) ? params.date : todayEntryDate(),
  );
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("11:45");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [notes, setNotes] = useState("");
  // Which of the two times carries the design's green underline. The design
  // marks the one last touched; "end" matches the mockup's initial state.
  const [focused, setFocused] = useState<"start" | "end">("end");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  /**
   * The tabbar's stamp button opens this screen without a parameter, so the
   * employee is resolved here when the caller did not pass one.
   */
  const [employeeId, setEmployeeId] = useState(params.employeeId ?? null);

  useEffect(() => {
    if (employeeId) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchMyTimeTracking();
        if (!cancelled) setEmployeeId(data.employeeId ?? null);
      } catch {
        // Leaving it unset disables saving, which the button below reflects;
        // an alert on open would fire before the user did anything.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const minutes = previewMinutes(date, startTime, endTime, breakMinutes);

  const applyQuickSpan = ([from, to]: [string, string]) => {
    setStartTime(from);
    setEndTime(to);
  };

  /** Extends the end of the span, the design's "+15 Min." / "+30 Min.". */
  const extendEnd = (delta: number) => {
    if (!TIME_RE.test(endTime)) return;
    const [h, m] = endTime.split(":").map(Number);
    const total = h * 60 + m + delta;
    // Stop at the end of the day rather than wrapping into the next one: the
    // backend stores a single day per entry.
    if (total >= 24 * 60) return;
    setEndTime(
      `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
        total % 60,
      ).padStart(2, "0")}`,
    );
  };

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
    if (minutes != null && minutes <= 0) {
      next.breakMinutes = t("TimeTracking.invalidBreak");
    }
    if (notes.length > 255) next.notes = t("TimeTracking.noteTooLong");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    if (!employeeId) return;
    setBusy(true);
    try {
      const trimmed = notes.trim();
      await createEntry({
        employeeId,
        startedAt: combineDateTime(date, startTime),
        endedAt: combineDateTime(date, endTime),
        breakMinutes,
        notes: trimmed || null,
      });
      router.back();
    } catch (e) {
      Alert.alert(t("Common.error"), gqlErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SheetHeader
          title={t("TimeTracking.captureWorkTime")}
          onClose={() => router.back()}
          closeLabel={t("Common.cancel")}
          onConfirm={save}
          confirmLabel={t("TimeTracking.saveEntry")}
          confirmDisabled={busy || !employeeId}
        />

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-3 px-5 pb-6"
        >
          <DateCard
            label={t("TimeTracking.date")}
            value={date}
            onChange={setDate}
            error={errors.date}
          />

          {/* The span card: both times large, the total on a divided footer. */}
          <FieldCard>
            <View className="flex-row items-center gap-3">
              <TimeValueField
                label={t("TimeTracking.from")}
                date={date}
                value={startTime}
                onChange={setStartTime}
                active={focused === "start"}
                onFocus={() => setFocused("start")}
              />
              <TimeArrow />
              <TimeValueField
                label={t("TimeTracking.to")}
                date={date}
                value={endTime}
                onChange={setEndTime}
                active={focused === "end"}
                onFocus={() => setFocused("end")}
              />
            </View>
            <CardTotal>
              <Text className="text-[12.5px] text-muted-foreground">
                {t("TimeTracking.recorded")}{" "}
                <Text className="font-mono-bold text-sm text-foreground">
                  {minutes != null ? formatDuration(minutes) : "–"}
                </Text>{" "}
                · {t("TimeTracking.lessBreak", { minutes: breakMinutes })}
              </Text>
            </CardTotal>
          </FieldCard>

          {errors.startTime || errors.endTime ? (
            <Text className="text-xs text-destructive">
              {errors.startTime ?? errors.endTime}
            </Text>
          ) : null}

          {/* Quick fills. */}
          <View className="flex-row flex-wrap gap-[7px]">
            {QUICK_SPANS.map((q) => (
              <QuickPill
                key={q.key}
                label={q.label()}
                active={startTime === q.span[0] && endTime === q.span[1]}
                onPress={() => applyQuickSpan(q.span)}
              />
            ))}
            {[15, 30].map((delta) => (
              <QuickPill
                key={delta}
                label={t(
                  delta === 15
                    ? "TimeTracking.quickPlus15"
                    : "TimeTracking.quickPlus30",
                )}
                onPress={() => extendEnd(delta)}
              />
            ))}
          </View>

          {/*
           * Activity and class/project have no backing column yet. They keep the
           * design's shape but are disabled and announced as such, so neither
           * reads as a control that would be saved.
           */}
          <FieldLabel>{t("TimeTracking.activity")}</FieldLabel>
          <View className="gap-2">
            {[ACTIVITIES.slice(0, 2), ACTIVITIES.slice(2)].map((pair, row) => (
              <View key={row} className="flex-row gap-2">
                {pair.map((a) => (
                  <CategoryTile
                    key={a.key}
                    icon={a.icon}
                    label={a.label()}
                    disabled
                    accessibilityLabel={`${a.label()} — ${t("TimeTracking.notYetAvailable")}`}
                  />
                ))}
              </View>
            ))}
          </View>

          <PickRow
            caption={t("TimeTracking.classOrProject")}
            value={t("TimeTracking.notYetAvailable")}
            placeholder
            trailing={<Icon name="chevronDown" size={16} color={colors.mutedForeground} />}
            disabled
            accessibilityLabel={`${t("TimeTracking.classOrProject")} — ${t("TimeTracking.notYetAvailable")}`}
          />

          {/* Break stepper. */}
          <View className="gap-1.5">
            <PickRow
              caption={t("TimeTracking.break")}
              value={t("TimeTracking.breakManual")}
              trailing={
                <Stepper
                  value={t("TimeTracking.breakMinutesShort", {
                    minutes: breakMinutes,
                  })}
                  onDecrease={() =>
                    setBreakMinutes((v) => Math.max(0, v - BREAK_STEP))
                  }
                  onIncrease={() =>
                    setBreakMinutes((v) => Math.min(BREAK_MAX, v + BREAK_STEP))
                  }
                  decreaseLabel={t("TimeTracking.decreaseBreak")}
                  increaseLabel={t("TimeTracking.increaseBreak")}
                  canDecrease={breakMinutes > 0}
                  canIncrease={breakMinutes < BREAK_MAX}
                />
              }
            />
            {errors.breakMinutes ? (
              <Text className="text-xs text-destructive">
                {errors.breakMinutes}
              </Text>
            ) : null}
          </View>

          {/* Note. */}
          <View className="gap-1.5">
            <PickRow
              icon="note"
              caption={t("TimeTracking.noteOptional")}
              alignTop
            >
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={255}
                placeholder={t("TimeTracking.notePlaceholder")}
                placeholderTextColor={colors.mutedForeground}
                className="mt-px min-h-10 p-0 text-[14.5px] font-medium text-foreground"
              />
            </PickRow>
            {errors.notes ? (
              <Text className="text-xs text-destructive">{errors.notes}</Text>
            ) : null}
          </View>
        </ScrollView>

        <SheetFooter
          secondaryLabel={t("TimeTracking.discard")}
          onSecondary={() => router.back()}
          primaryLabel={t("TimeTracking.saveEntry")}
          onPrimary={save}
          primaryDisabled={busy || !employeeId}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
