const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function hasAnyWindows(
  windows?: Record<string, { start: string; end: string }[] | undefined> | null,
): boolean {
  if (!windows) return false;
  return WEEKDAY_KEYS.some((key) => (windows[key]?.length ?? 0) > 0);
}

function hasAnyWorkloads(
  workloads?: Record<string, number | null | undefined> | null,
): boolean {
  if (!workloads) return false;
  return WEEKDAY_KEYS.some((key) => {
    const value = workloads[key];
    return value != null && Number(value) > 0;
  });
}

/**
 * Exact times win over day shares. When neither is set, both are cleared so a
 * previous plan cannot linger after switching back to pensum-only.
 */
export function resolveContractScheduleFields(values: {
  weekdayTimeWindows?: Record<
    string,
    { start: string; end: string }[] | undefined
  > | null;
  weekdayWorkloads?: Record<string, number | null | undefined> | null;
}): {
  weekdayTimeWindows: typeof values.weekdayTimeWindows | null;
  weekdayWorkloads: typeof values.weekdayWorkloads | null;
} {
  const hasWindows = hasAnyWindows(values.weekdayTimeWindows);
  const hasWorkloads = hasAnyWorkloads(values.weekdayWorkloads);
  return {
    weekdayTimeWindows: hasWindows ? values.weekdayTimeWindows : null,
    weekdayWorkloads: !hasWindows && hasWorkloads ? values.weekdayWorkloads : null,
  };
}
