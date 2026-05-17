export type WindowKey = "last90" | "last6m" | "last12m" | "schoolYear" | "all";

export const WINDOW_KEYS: WindowKey[] = [
  "last90",
  "last6m",
  "last12m",
  "schoolYear",
  "all",
];

/**
 * Resolve the cutoff date for a given window. Records with `recordedAt`
 * strictly older than the cutoff are excluded.
 *
 * Swiss school-year convention: 1. August → 31. July. When today is
 * before 1. August, the active school year is the one that started the
 * previous August.
 */
export function getWindowCutoff(
  key: WindowKey,
  today: Date = new Date(),
): Date | null {
  if (key === "all") return null;
  const d = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  if (key === "last90") {
    d.setUTCDate(d.getUTCDate() - 90);
    return d;
  }
  if (key === "last6m") {
    d.setUTCMonth(d.getUTCMonth() - 6);
    return d;
  }
  if (key === "last12m") {
    d.setUTCMonth(d.getUTCMonth() - 12);
    return d;
  }
  if (key === "schoolYear") {
    const year = today.getUTCFullYear();
    const augFirst = new Date(Date.UTC(year, 7, 1));
    return today.getTime() < augFirst.getTime()
      ? new Date(Date.UTC(year - 1, 7, 1))
      : augFirst;
  }
  return null;
}

export function filterRecordsByWindow<T extends { recordedAt: string }>(
  records: T[],
  key: WindowKey,
  today: Date = new Date(),
): { filtered: T[]; cutoff: Date | null } {
  const cutoff = getWindowCutoff(key, today);
  if (!cutoff) return { filtered: records, cutoff: null };
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return {
    filtered: records.filter((r) => r.recordedAt >= cutoffStr),
    cutoff,
  };
}
