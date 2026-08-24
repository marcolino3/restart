/**
 * Pure self-service date rules without a zod dependency so the mobile app
 * can import them directly.
 */
const startOfDay = (value: Date) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

export interface AbsenceNoticeCategoryRules {
  requiresApproval: boolean;
  allowsDateRange?: boolean | null;
  maxDaysPerRequest?: number | null;
}

export type AbsenceNoticeDateErrorCode =
  | "past"
  | "tooFar"
  | "endBeforeStart"
  | "singleDayOnly"
  | "tooManyDays"
  | "yearlyCap";

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
  values: { startDate?: Date | null; endDate?: Date | null },
  category: boolean | AbsenceNoticeCategoryRules,
): { field: "startDate" | "endDate"; code: AbsenceNoticeDateErrorCode } | null {
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
  return null;
}

/** Maps a backend rejection of createEmployeeAbsenceNotice to a form error code. */
export function absenceNoticeErrorCode(
  message: string | null | undefined,
): { field: "startDate" | "endDate"; code: AbsenceNoticeDateErrorCode } | null {
  if (!message) return null;
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
