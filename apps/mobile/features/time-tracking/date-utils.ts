/**
 * Date helpers for the time-tracking screens.
 *
 * Entry dates are plain `YYYY-MM-DD` strings from the backend (a `date`
 * column, not a timestamp). Parsing those with `new Date(s)` would read them
 * as UTC midnight and shift the day backwards west of Greenwich, so every
 * conversion here goes through the explicit local-noon form instead.
 */

const WEEKDAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] as const;
const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;

/** `YYYY-MM-DD` → Date at local noon, safe from timezone day-shifts. */
export const parseEntryDate = (date: string): Date =>
  new Date(`${date}T12:00:00`);

/** Date → `YYYY-MM-DD` in local time. */
export const toEntryDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export const todayEntryDate = (): string => toEntryDate(new Date());

/** Day number without a leading zero, as shown on the date tile. */
export const dayOfMonth = (date: string): string =>
  String(parseEntryDate(date).getDate());

/** "Mo" … "So". */
export const weekdayShort = (date: string): string =>
  WEEKDAYS_SHORT[parseEntryDate(date).getDay()];

/** "Mittwoch, 12. August" — the day-detail header. */
export const formatDayLong = (date: string): string => {
  const d = parseEntryDate(date);
  const long = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ][d.getDay()];
  return `${long}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
};

/** "Do., 13. August 2026" — the home screen's date line. */
export const formatDateLine = (d: Date): string =>
  `${WEEKDAYS_SHORT[d.getDay()]}., ${d.getDate()}. ${
    MONTHS[d.getMonth()]
  } ${d.getFullYear()}`;

export const monthLabel = (year: number, month: number): string =>
  `${MONTHS[month]} ${year}`;

/**
 * The calendar grid for a month, Monday-first, padded with the surrounding
 * months' days so every row holds seven cells.
 */
export type CalendarCell = { date: string; inMonth: boolean };

export const monthGrid = (year: number, month: number): CalendarCell[] => {
  const first = new Date(year, month, 1);
  // getDay() is Sunday-based; shift so Monday starts the week.
  const lead = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - lead);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ date: toEntryDate(d), inMonth: d.getMonth() === month });
    // Stop after a completed week once the month is behind us, so short
    // months render five rows instead of a trailing empty sixth.
    if (i % 7 === 6 && d.getMonth() !== month && d > first) break;
  }
  return cells;
};

/** Combine `YYYY-MM-DD` and `HH:MM` into an ISO timestamp in local time. */
export const combineDateTime = (date: string, time: string): string => {
  const [h, m] = time.split(":").map(Number);
  const d = parseEntryDate(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

/** ISO → `HH:MM` for prefilling the time picker. */
export const timeValue = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
};
