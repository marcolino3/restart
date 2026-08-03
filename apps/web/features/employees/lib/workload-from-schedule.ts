import type {
  TimeWindow,
  WeekdayTimeWindows,
} from "@restart/shared-schemas/employees/employee-onboarding-form.schema";

/**
 * Fallback for the full-time reference while the contract has no
 * `weeklyHours` yet. 42 h is the common Swiss school baseline.
 */
export const DEFAULT_FULLTIME_WEEKLY_HOURS = 42;

/** Derived workload counts as "in sync" with the plan within this tolerance. */
const MATCH_TOLERANCE = 0.05;

const WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":");
  return (Number(h) || 0) * 60 + (Number(m) || 0);
};

const windowMinutes = (w: TimeWindow): number =>
  Math.max(0, toMinutes(w.end) - toMinutes(w.start));

/** Total planned minutes per week across all weekday time windows. */
export function scheduleWeeklyMinutes(
  windows?: WeekdayTimeWindows | null,
): number {
  if (!windows) return 0;
  return WEEKDAY_KEYS.reduce((sum, key) => {
    const dayWindows = windows[key];
    if (!dayWindows) return sum;
    return sum + dayWindows.reduce((s, w) => s + windowMinutes(w), 0);
  }, 0);
}

/** Parses the free-text weekly hours field; falls back to the default. */
export function parseFullTimeWeeklyHours(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_FULLTIME_WEEKLY_HOURS;
}

/**
 * Workload the weekly schedule corresponds to, in percent of the full-time
 * reference, rounded to one decimal. `null` when the plan is empty — an empty
 * plan means "not specified", not 0 %.
 */
export function deriveWorkloadPercent(
  windows: WeekdayTimeWindows | null | undefined,
  fullTimeWeeklyHours: number,
): number | null {
  const minutes = scheduleWeeklyMinutes(windows);
  if (minutes <= 0 || fullTimeWeeklyHours <= 0) return null;
  const percent = (minutes / 60 / fullTimeWeeklyHours) * 100;
  return Math.round(Math.min(percent, 100) * 10) / 10;
}

/** True when the stored workload still matches what the plan implies. */
export function matchesDerivedWorkload(
  stored: number | null | undefined,
  derived: number | null,
): boolean {
  if (derived == null) return false;
  if (stored == null) return true;
  return Math.abs(Number(stored) - derived) < MATCH_TOLERANCE;
}
