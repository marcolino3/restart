/**
 * Pure self-service date rules without a zod dependency so the mobile app
 * can import them directly.
 */
const startOfDay = (value: Date) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Finest unit an employee may use for a category (upper bound: TIME also
 * allows whole and half days); mirrors the backend enum.
 */
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
  /** Latest allowed start, in days from today (1 = today or tomorrow); null = open. */
  maxDaysAhead?: number | null;
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
  | "halfDaySingleDay"
  | "overlap";

export type AbsenceNoticeErrorField =
  "startDate" | "endDate" | "startTime" | "endTime";

/** How the employee chose to enter a single absence; same scale as the precision. */
export type AbsenceEntryModeType = AbsenceEntryPrecisionType;

const PRECISION_RANK: Record<AbsenceEntryPrecisionType, number> = {
  DAY: 0,
  HALF_DAY: 1,
  TIME: 2,
};

/** Entry modes a category permits, coarsest first. */
export function allowedAbsenceEntryModes(
  precision: AbsenceEntryPrecisionType | null | undefined,
): AbsenceEntryModeType[] {
  const rank = PRECISION_RANK[precision ?? AbsenceEntryPrecision.DAY];
  return (Object.keys(PRECISION_RANK) as AbsenceEntryPrecisionType[]).filter(
    (mode) => PRECISION_RANK[mode] <= rank,
  );
}

export interface AbsenceNoticeValues {
  startDate?: Date | null;
  endDate?: Date | null;
  /** Chosen entry mode; defaults to DAY when omitted. */
  entryMode?: AbsenceEntryModeType | null;
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
 * Self-service date rules, mirrored by the backend. The start must not lie in
 * the past nor more than `maxDaysAhead` days ahead (null = open future; the
 * boolean shorthand keeps the legacy "notice = today or tomorrow" rule). A
 * range is only allowed when the category permits it and, if configured, must
 * not exceed `maxDaysPerRequest` days.
 */
export function checkAbsenceNoticeDates(
  values: AbsenceNoticeValues,
  category: boolean | AbsenceNoticeCategoryRules,
): { field: AbsenceNoticeErrorField; code: AbsenceNoticeDateErrorCode } | null {
  const rules: AbsenceNoticeCategoryRules =
    typeof category === "boolean"
      ? { requiresApproval: category, maxDaysAhead: category ? null : 1 }
      : category;
  const start = values.startDate ? startOfDay(values.startDate) : null;
  if (!start) return null;
  const today = startOfDay(new Date());
  if (start < today) return { field: "startDate", code: "past" };
  if (rules.maxDaysAhead != null) {
    const last = new Date(today);
    last.setDate(last.getDate() + rules.maxDaysAhead);
    if (start > last) return { field: "startDate", code: "tooFar" };
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
 * Day-part / time rules (mirrored by the backend). The precision is an upper
 * bound: a TIME category accepts whole days, half days and a time of day, a
 * HALF_DAY category whole and half days, a DAY category whole days only.
 * Half days and times are single-day only; the end time may stay open.
 */
export function checkAbsenceNoticeTiming(
  values: Pick<
    AbsenceNoticeValues,
    "entryMode" | "dayPart" | "startTime" | "endTime"
  >,
  rules: Pick<AbsenceNoticeCategoryRules, "entryPrecision">,
  requestedDays: number,
): { field: AbsenceNoticeErrorField; code: AbsenceNoticeDateErrorCode } | null {
  const allowed = allowedAbsenceEntryModes(rules.entryPrecision);
  const mode = values.entryMode ?? AbsenceEntryPrecision.DAY;
  if (!allowed.includes(mode)) return null; // hidden in the UI; backend rejects
  if (mode === AbsenceEntryPrecision.TIME) {
    if (!values.startTime || !HHMM.test(values.startTime)) {
      return { field: "startTime", code: "timeRequired" };
    }
    if (values.endTime) {
      if (!HHMM.test(values.endTime)) {
        return { field: "endTime", code: "timeRequired" };
      }
      if (toMinutes(values.endTime) <= toMinutes(values.startTime)) {
        return { field: "endTime", code: "timeOrder" };
      }
    }
    if (requestedDays > 1) {
      return { field: "endDate", code: "halfDaySingleDay" };
    }
    return null;
  }
  if (mode === AbsenceEntryPrecision.HALF_DAY) {
    const dayPart = values.dayPart ?? AbsenceDayPart.FULL;
    if (dayPart !== AbsenceDayPart.FULL && requestedDays > 1) {
      return { field: "endDate", code: "halfDaySingleDay" };
    }
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
  if (
    message.includes("Half days are only possible") ||
    message.includes("time of day is only possible")
  ) {
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
  if (message.includes("days ahead")) {
    return { field: "startDate", code: "tooFar" };
  }
  if (message.includes("already has an absence")) {
    return { field: "startDate", code: "overlap" };
  }
  return null;
}
