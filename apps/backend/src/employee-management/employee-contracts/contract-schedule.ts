const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export function hasScheduleWindows(windows: unknown): boolean {
  if (!windows || typeof windows !== 'object') return false;
  return WEEKDAY_KEYS.some((key) => {
    const day = (windows as Record<string, unknown>)[key];
    return Array.isArray(day) && day.length > 0;
  });
}

export function hasScheduleWorkloads(workloads: unknown): boolean {
  if (!workloads || typeof workloads !== 'object') return false;
  return WEEKDAY_KEYS.some((key) => {
    const value = (workloads as Record<string, unknown>)[key];
    return value != null && value !== '' && Number(value) > 0;
  });
}

/**
 * Exact clock times win over day shares. Empty objects / null-only days are
 * cleared so leftover JSON never looks like an active plan.
 */
export function applyExclusiveScheduleFields<
  T extends {
    weekdayTimeWindows?: unknown;
    weekdayWorkloads?: unknown;
  },
>(values: T): T {
  if (hasScheduleWindows(values.weekdayTimeWindows)) {
    values.weekdayWorkloads = null;
  } else if (hasScheduleWorkloads(values.weekdayWorkloads)) {
    values.weekdayTimeWindows = null;
  } else {
    values.weekdayTimeWindows = null;
    values.weekdayWorkloads = null;
  }
  return values;
}
