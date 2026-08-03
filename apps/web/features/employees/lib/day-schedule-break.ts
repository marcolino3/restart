import type { TimeWindow } from "@restart/shared-schemas/employees/employee-onboarding-form.schema";

const SNAP_MINUTES = 15;
const NOON_MINUTES = 12 * 60;

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":");
  return (Number(h) || 0) * 60 + (Number(m) || 0);
};

const fmt = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const snap = (minutes: number): number =>
  Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

function sortWindows(windows: TimeWindow[]): TimeWindow[] {
  return [...windows].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

/** Outer span of a day: first start → last end. */
export function dayOuterSpan(
  windows: TimeWindow[],
): { start: string; end: string } | null {
  const sorted = sortWindows(windows).filter(
    (w) => toMinutes(w.end) > toMinutes(w.start),
  );
  if (sorted.length === 0) return null;
  return {
    start: sorted[0].start,
    end: sorted[sorted.length - 1].end,
  };
}

/** Sum of unpaid gaps between consecutive windows, in minutes. */
export function dayBreakMinutes(windows: TimeWindow[]): number {
  const sorted = sortWindows(windows);
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = toMinutes(sorted[i].start) - toMinutes(sorted[i - 1].end);
    if (gap > 0) total += gap;
  }
  return total;
}

/**
 * Rebuilds a day as one or two work windows from an outer span and an unpaid
 * break duration. The break prefers to sit at noon when that fits; otherwise it
 * is centered so morning and afternoon work are roughly equal.
 *
 * Breaks are not a separate persisted field — they are the gap between windows,
 * which the work-time engine already ignores when summing planned minutes.
 */
export function rebuildDayWithBreak(
  start: string,
  end: string,
  breakMinutes: number,
): TimeWindow[] {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (!(endMin > startMin)) return [];

  const span = endMin - startMin;
  const breakMin = Math.max(0, Math.round(Number(breakMinutes) || 0));

  if (breakMin <= 0 || breakMin >= span) {
    return [{ start: fmt(startMin), end: fmt(endMin) }];
  }

  let breakStart: number;
  if (startMin < NOON_MINUTES && NOON_MINUTES + breakMin <= endMin) {
    breakStart = NOON_MINUTES;
  } else {
    const work = span - breakMin;
    breakStart = snap(startMin + Math.floor(work / 2));
    // Keep the break fully inside the outer span after snapping.
    breakStart = Math.max(startMin, Math.min(breakStart, endMin - breakMin));
  }

  const morningEnd = breakStart;
  const afternoonStart = breakStart + breakMin;
  if (morningEnd <= startMin || afternoonStart >= endMin) {
    return [{ start: fmt(startMin), end: fmt(endMin) }];
  }

  return [
    { start: fmt(startMin), end: fmt(morningEnd) },
    { start: fmt(afternoonStart), end: fmt(endMin) },
  ];
}
