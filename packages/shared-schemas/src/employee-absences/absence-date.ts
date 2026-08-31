/** Parse absence date/time from API, form state or server-action JSON. */
export function parseAbsenceDateTime(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" && value.trim()) {
    // GraphQL `@Field(() => String)` on Date columns serializes as epoch ms.
    if (/^\d+$/.test(value)) {
      const date = new Date(Number(value));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    // Legacy date-only values (YYYY-MM-DD) → local start of day.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      const date = new Date(y, m - 1, d, 0, 0, 0, 0);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** True when the stored timestamp carries an explicit time (not date-only). */
export function hasAbsenceTime(value: unknown): boolean {
  const date = parseAbsenceDateTime(value);
  if (!date) return false;
  const utcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
  const localMidnight =
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0;
  return !(utcMidnight || localMidnight);
}

export function absenceIncludesTime(start: unknown, end?: unknown): boolean {
  return hasAbsenceTime(start) || hasAbsenceTime(end);
}

export function formatAbsenceDateTime(
  value: unknown,
  locale: string,
  options?: { includeTime?: boolean },
): string | undefined {
  const date = parseAbsenceDateTime(value);
  if (!date) return undefined;
  const includeTime = options?.includeTime ?? hasAbsenceTime(date);
  if (!includeTime) {
    return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function normalizeAbsenceDateForSave(
  value: unknown,
  includesTime: boolean,
): Date | null {
  const date = parseAbsenceDateTime(value);
  if (!date) return null;
  return includesTime ? date : startOfLocalDay(date);
}

/** Local calendar day as `YYYY-MM-DD` (no timezone shift). */
export function toAbsenceIsoDate(value: unknown): string | undefined {
  const date = parseAbsenceDateTime(value);
  if (!date) return undefined;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Serialize for GraphQL save.
 * - with time → full ISO datetime
 * - date-only → `YYYY-MM-DD` (avoids UTC day-shift from local midnight)
 */
export function toAbsenceIsoDateTime(
  value: unknown,
  includesTime = true,
): string | undefined {
  if (!includesTime) return toAbsenceIsoDate(value);
  const date = normalizeAbsenceDateForSave(value, true);
  if (!date) return undefined;
  return date.toISOString();
}
