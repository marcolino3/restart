import { toISODate } from "./to-iso-date";

export const WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

/** 'YYYY-MM-DD' → Date at local midnight. */
export const parseIsoDate = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Weekday key (mon..sun) of an ISO date. */
export const weekdayOf = (iso: string): WeekdayKey => {
  const js = parseIsoDate(iso).getDay(); // 0 = Sunday
  return WEEKDAY_KEYS[(js + 6) % 7];
};

/** Inclusive list of ISO dates between start and end. */
export const datesBetween = (start: string, end: string): string[] => {
  const out: string[] = [];
  const cur = parseIsoDate(start);
  const last = parseIsoDate(end);
  while (cur <= last) {
    out.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
};

/** ISO-8601 week number (1..53). */
export const isoWeekOf = (iso: string): number => {
  const d = parseIsoDate(iso);
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/** Localised short weekday label for a weekday key (Mo / Mon ...). */
export const weekdayLabel = (key: WeekdayKey, locale: string): string => {
  // 2024-01-01 is a Monday.
  const ref = new Date(2024, 0, 1 + WEEKDAY_KEYS.indexOf(key));
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    weekday: "short",
  }).format(ref);
};

export const formatPlanDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(parseIsoDate(iso));

export const formatIsoDateLong = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseIsoDate(iso));
