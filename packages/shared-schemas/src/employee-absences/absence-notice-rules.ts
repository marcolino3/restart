/**
 * Pure self-service date rules without a zod dependency so the mobile app
 * can import them directly.
 */
const startOfDay = (value: Date) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Finest unit an employee may use for a category; mirrors the backend enum. */
export const AbsenceEntryPrecision = {
  DAY: "DAY",
  HALF_DAY: "HALF_DAY",
  TIME: "TIME",
} as const;
export type AbsenceEntryPrecisionType =
  (typeof AbsenceEntryPrecision)[keyof typeof AbsenceEntryPrecision];

/** Part of the day a single-day absence covers; mirrors the backend enum. */
export const AbsenceDayPart = {
  FULL: "FULL",
  MORNING: "MORNING",
  AFTERNOON: "AFTERNOON",
} as const;
export type AbsenceDayPartType =
  (typeof AbsenceDayPart)[keyof typeof AbsenceDayPart];

export interface AbsenceNoticeCategoryRules {
  requiresApproval: boolean;
  allowsDateRange?: boolean | null;
  maxDaysPerRequest?: number | null;
  entryPrecision?: AbsenceEntryPrecisionType | null;
}

export type AbsenceNoticeDateErrorCode =
  | "past"
  | "tooFar"
  | "endBeforeStart"
  | "singleDayOnly"
  | "tooManyDays"
  | "yearlyCap"
  | "timeRequired"
  | "timeOrder"
  | "halfDaySingleDay";

export type AbsenceNoticeErrorField =
  "startDate" | "endDate" | "startTime" | "endTime";

export interface AbsenceNoticeValues {
  startDate?: Date | null;
  endDate?: Date | null;
  dayPart?: AbsenceDayPartType | null;
  /** "HH:mm" */
  startTime?: string | null;
  endTime?: string | null;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Inclusive calendar days between two dates (same-day = 1). */
export function absenceNoticeDayCount(start: Date, end?: Date | null): number {
  const s = startOfDay(start).getTime();
  const e = startOfDay(end ?? start).getTime();
  return Math.round((e - s) / 86_400_000) + 1;
}

/**
 * Self-service date rules, mirrored by the backend. A notice category
 * (`requiresApproval = false`) only covers today or tomorrow and is definitive
 * at once; a request category may lie anywhere in the future and waits for a
 * decision. A range is only allowed when the category permits it and, if
 * configured, must not exceed `maxDaysPerRequest` days.
 */
export function checkAbsenceNoticeDates(
  values: AbsenceNoticeValues,
  category: boolean | AbsenceNoticeCategoryRules,
): { field: AbsenceNoticeErrorField; code: AbsenceNoticeDateErrorCode } | null {
  const rules: AbsenceNoticeCategoryRules =
    typeof category === "boolean" ? { requiresApproval: category } : category;
  const start = values.startDate ? startOfDay(values.startDate) : null;
  if (!start) return null;
  const today = startOfDay(new Date());
  if (start < today) return { field: "startDate", code: "past" };
  if (!rules.requiresApproval) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (start > tomorrow) return { field: "startDate", code: "tooFar" };
  }
  const end = values.endDate ? startOfDay(values.endDate) : null;
  if (end && end < start) return { field: "endDate", code: "endBeforeStart" };
  if (end && end > start && !rules.allowsDateRange) {
    return { field: "endDate", code: "singleDayOnly" };
  }
  if (
    rules.maxDaysPerRequest != null &&
    absenceNoticeDayCount(start, end) > rules.maxDaysPerRequest
  ) {
    return { field: "endDate", code: "tooManyDays" };
  }
  return checkAbsenceNoticeTiming(
    values,
    rules,
    absenceNoticeDayCount(start, end),
  );
}

/**
 * Day-part / time rules per entry precision (mirrored by the backend): a TIME
 * category needs a valid start–end pair on one day, a HALF_DAY category may
 * carry a day part on single days only, a DAY category neither.
 */
export function checkAbsenceNoticeTiming(
  values: Pick<AbsenceNoticeValues, "dayPart" | "startTime" | "endTime">,
  rules: Pick<AbsenceNoticeCategoryRules, "entryPrecision">,
  requestedDays: number,
): { field: AbsenceNoticeErrorField; code: AbsenceNoticeDateErrorCode } | null {
  const precision = rules.entryPrecision ?? AbsenceEntryPrecision.DAY;
  const dayPart = values.dayPart ?? AbsenceDayPart.FULL;
  if (precision === AbsenceEntryPrecision.TIME) {
    if (!values.startTime || !HHMM.test(values.startTime)) {
      return { field: "startTime", code: "timeRequired" };
    }
    if (!values.endTime || !HHMM.test(values.endTime)) {
      return { field: "endTime", code: "timeRequired" };
    }
    if (toMinutes(values.endTime) <= toMinutes(values.startTime)) {
      return { field: "endTime", code: "timeOrder" };
    }
    return null;
  }
  if (
    dayPart !== AbsenceDayPart.FULL &&
    precision === AbsenceEntryPrecision.HALF_DAY &&
    requestedDays > 1
  ) {
    return { field: "endDate", code: "halfDaySingleDay" };
  }
  return null;
}

/** Maps a backend rejection of createEmployeeAbsenceNotice to a form error code. */
export function absenceNoticeErrorCode(
  message: string | null | undefined,
): { field: AbsenceNoticeErrorField; code: AbsenceNoticeDateErrorCode } | null {
  if (!message) return null;
  if (message.includes("start and end time")) {
    return { field: "startTime", code: "timeRequired" };
  }
  if (message.includes("End time must be after")) {
    return { field: "endTime", code: "timeOrder" };
  }
  if (message.includes("Half days are only possible")) {
    return { field: "endDate", code: "halfDaySingleDay" };
  }
  if (message.includes("ABSENCE_YEARLY_CAP")) {
    return { field: "endDate", code: "yearlyCap" };
  }
  if (message.includes("single-day")) {
    return { field: "endDate", code: "singleDayOnly" };
  }
  if (message.includes("days per request")) {
    return { field: "endDate", code: "tooManyDays" };
  }
  if (message.includes("today or tomorrow")) {
    return { field: "startDate", code: "tooFar" };
  }
  return null;
}
