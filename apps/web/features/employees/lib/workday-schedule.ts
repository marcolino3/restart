import type { TimeWindow } from "@restart/shared-schemas/employees/employee-onboarding-form.schema";
import {
  WEEKDAY_KEYS,
  type WeekdayKey,
} from "@restart/shared-schemas/employees/employee-onboarding-form.schema";
import { rebuildDayWithBreak } from "./day-schedule-break";
import {
  DEFAULT_FULLTIME_WEEKLY_HOURS,
  parseFullTimeWeeklyHours,
} from "./workload-from-schedule";

export type WeekdayWorkloads = Partial<Record<WeekdayKey, number | null>>;

export const WORKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;
export type WorkdayKey = (typeof WORKDAY_KEYS)[number];

/** Quick pensum chips in 10 % steps. */
export const QUICK_WORKLOAD_PERCENTS = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
] as const;

/**
 * How many consecutive Mon–Fri days a pensum chip implies (≈ 20 % per day).
 * 10/20 → Mo · 30/40 → Mo–Di · 50/60 → Mo–Mi · 70/80 → Mo–Do · 90/100 → Mo–Fr.
 */
export function workdayCountForPensum(percent: number): number {
  if (percent <= 0) return 0;
  return Math.min(
    WORKDAY_KEYS.length,
    Math.max(1, Math.round(Number(percent) / 20)),
  );
}

/** Consecutive workdays starting Monday for the given pensum chip. */
export function consecutiveWorkdaysForPensum(percent: number): WeekdayKey[] {
  return WORKDAY_KEYS.slice(0, workdayCountForPensum(percent));
}

const DEFAULT_BREAK_MINUTES = 45;
const DAY_START = "08:00";

/** True when at least one weekday has a positive workload share. */
export function hasWeekdayWorkloads(
  workloads?: WeekdayWorkloads | null,
): boolean {
  if (!workloads) return false;
  return WEEKDAY_KEYS.some((key) => {
    const value = workloads[key];
    return value != null && Number(value) > 0;
  });
}

/** Weekdays that currently carry a positive share. */
export function selectedDaysFromWorkloads(
  workloads?: WeekdayWorkloads | null,
): WeekdayKey[] {
  if (!workloads) return [];
  return WEEKDAY_KEYS.filter((key) => {
    const value = workloads[key];
    return value != null && Number(value) > 0;
  });
}

/** Weekdays that currently have at least one time window. */
export function selectedDaysFromWindows(
  windows?: Partial<Record<WeekdayKey, TimeWindow[] | null>> | null,
): WeekdayKey[] {
  if (!windows) return [];
  return WEEKDAY_KEYS.filter((key) => (windows[key]?.length ?? 0) > 0);
}

/** Short weekday labels for summary lines (locale-agnostic CH abbreviations). */
export const WEEKDAY_SHORT_LABELS: Record<WeekdayKey, string> = {
  mon: "Mo",
  tue: "Di",
  wed: "Mi",
  thu: "Do",
  fri: "Fr",
  sat: "Sa",
  sun: "So",
};

function windowsSignature(windows: TimeWindow[]): string {
  return windows.map((w) => `${w.start}-${w.end}`).join("|");
}

function formatWindowsInline(windows: TimeWindow[]): string {
  return windows.map((w) => `${w.start}–${w.end}`).join(" · ");
}

/**
 * Compact plan lines for the summary aside.
 * Identical windows across consecutive days collapse to `Mo–Mi 08:00–17:00`.
 * Returns [] when no exact times are set.
 */
export function formatExactTimesPlanLines(
  windows?: Partial<Record<WeekdayKey, TimeWindow[] | null>> | null,
): string[] {
  const days = selectedDaysFromWindows(windows);
  if (!windows || days.length === 0) return [];

  const lines: string[] = [];
  let i = 0;
  while (i < days.length) {
    const startKey = days[i];
    const dayWindows = (windows[startKey] ?? []).filter(
      (w) => w.start && w.end,
    );
    if (dayWindows.length === 0) {
      i += 1;
      continue;
    }
    const sig = windowsSignature(dayWindows);
    let j = i + 1;
    while (j < days.length) {
      const nextWindows = (windows[days[j]] ?? []).filter(
        (w) => w.start && w.end,
      );
      if (windowsSignature(nextWindows) !== sig) break;
      // Only collapse when days are consecutive in WORKDAY_KEYS order.
      const prevIdx = WEEKDAY_KEYS.indexOf(days[j - 1]);
      const nextIdx = WEEKDAY_KEYS.indexOf(days[j]);
      if (nextIdx !== prevIdx + 1) break;
      j += 1;
    }
    const endKey = days[j - 1];
    const dayRange =
      startKey === endKey
        ? WEEKDAY_SHORT_LABELS[startKey]
        : `${WEEKDAY_SHORT_LABELS[startKey]}–${WEEKDAY_SHORT_LABELS[endKey]}`;
    lines.push(`${dayRange} ${formatWindowsInline(dayWindows)}`);
    i = j;
  }
  return lines;
}

/** Short workday list for summaries without clock times, e.g. `Mo, Mi, Fr`. */
export function formatWorkdaysPlanLabel(
  workloads?: WeekdayWorkloads | null,
): string | undefined {
  const days = selectedDaysFromWorkloads(workloads);
  if (days.length === 0) return undefined;
  return days.map((key) => WEEKDAY_SHORT_LABELS[key]).join(", ");
}

/**
 * Splits `workloadPercent` evenly across the selected days as shares of the
 * full-time week. The engine treats these shares as already including pensum,
 * so their sum should equal the contract pensum.
 */
export function workloadsFromSelectedDays(
  selectedDays: WeekdayKey[],
  workloadPercent: number,
): WeekdayWorkloads {
  const unique = WEEKDAY_KEYS.filter((key) => selectedDays.includes(key));
  if (unique.length === 0) return {};

  const total = Math.max(0, Math.min(100, Number(workloadPercent) || 0));
  const base = Math.round((total / unique.length) * 10) / 10;
  const out: WeekdayWorkloads = {};
  let allocated = 0;
  unique.forEach((key, index) => {
    if (index === unique.length - 1) {
      out[key] = Math.round((total - allocated) * 10) / 10;
    } else {
      out[key] = base;
      allocated += base;
    }
  });
  return out;
}

/** Daily planned work minutes for one equally shared workday. */
export function dailyWorkMinutesForDays(
  selectedDaysCount: number,
  workloadPercent: number,
  weeklyHoursRaw: unknown,
): number {
  if (selectedDaysCount <= 0) return 0;
  const weeklyHours = parseFullTimeWeeklyHours(weeklyHoursRaw);
  const weeklyWork =
    weeklyHours * 60 * (Math.max(0, Math.min(100, workloadPercent)) / 100);
  return Math.round(weeklyWork / selectedDaysCount);
}

/**
 * Builds a standard day from 08:00 with a 45-minute unpaid break whenever the
 * work block is long enough for a midday pause. The outer end is chosen so the
 * work minutes match `dailyWorkMinutes`.
 */
export function suggestDayWindows(dailyWorkMinutes: number): TimeWindow[] {
  if (dailyWorkMinutes <= 0) return [];
  const breakMinutes =
    dailyWorkMinutes >= 5 * 60 ? DEFAULT_BREAK_MINUTES : 0;
  const endMinutes = 8 * 60 + dailyWorkMinutes + breakMinutes;
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const end = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  return rebuildDayWithBreak(DAY_START, end, breakMinutes);
}

/**
 * Suggests exact time windows for the selected days from pensum + weekly hours.
 * Returns an empty plan when no days are selected — workdays must be chosen
 * before time suggestions are generated.
 */
export function suggestScheduleWindows(input: {
  selectedDays: WeekdayKey[];
  workloadPercent: number;
  weeklyHoursRaw: unknown;
}): Partial<Record<WeekdayKey, TimeWindow[]>> {
  const workload = Math.max(0, Math.min(100, Number(input.workloadPercent) || 0));
  const days = WEEKDAY_KEYS.filter((key) => input.selectedDays.includes(key));
  if (days.length === 0) return {};

  const daily = dailyWorkMinutesForDays(
    days.length,
    workload || 100,
    input.weeklyHoursRaw ?? DEFAULT_FULLTIME_WEEKLY_HOURS,
  );
  const dayWindows = suggestDayWindows(daily);
  if (dayWindows.length === 0) return {};

  const out: Partial<Record<WeekdayKey, TimeWindow[]>> = {};
  for (const key of days) {
    out[key] = dayWindows.map((w) => ({ ...w }));
  }
  return out;
}
