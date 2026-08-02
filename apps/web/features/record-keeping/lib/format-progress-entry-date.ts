/**
 * Formats a lesson record's `recordedAt` for the progress table: relative
 * "today"/"yesterday" labels for recent entries, otherwise a spelled-out
 * weekday + date. Always pinned to the school's timezone, never the runtime
 * zone: this renders on the server (UTC) as well as in the browser, so an
 * unpinned formatter would show 07:00 instead of 09:00 and could even put a
 * late entry on the wrong calendar day.
 */
export const formatProgressEntryDate = (
  iso: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string,
  timeZone: string,
): string => {
  try {
    const date = new Date(iso);

    const dayKey = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);

    const time = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(date);

    if (sameDay(date, today)) return `${todayLabel}, ${time}`;
    if (sameDay(date, yesterday)) return yesterdayLabel;

    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone,
    }).format(date);
  } catch {
    return iso;
  }
};
