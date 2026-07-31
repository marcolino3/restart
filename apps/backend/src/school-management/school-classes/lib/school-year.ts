/**
 * School year maths derived from an organisation's cut-off date.
 *
 * There is no SchoolYear entity — see the migration that introduced
 * `organizations.school_year_start_month/day`. Everything that needs to know
 * "which year is this date in" resolves it here instead.
 */

export interface SchoolYearCutoff {
  schoolYearStartMonth: number;
  schoolYearStartDay: number;
}

export interface SchoolYearRange {
  /** First day of the school year, inclusive (ISO date, e.g. "2026-08-01"). */
  start: string;
  /** Last day of the school year, inclusive (ISO date, e.g. "2027-07-31"). */
  end: string;
  /** Calendar year the school year starts in — 2026 for "2026/27". */
  startYear: number;
  /** Display label, e.g. "2026/27". */
  label: string;
}

const pad = (n: number): string => String(n).padStart(2, '0');

const isoDate = (year: number, month: number, day: number): string =>
  `${year}-${pad(month)}-${pad(day)}`;

/** Today as an ISO date, in the server's local timezone. */
export const today = (): string => {
  const now = new Date();
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
};

/**
 * The school year that `date` falls into.
 *
 * A date before the cut-off still belongs to the year that started the previous
 * calendar year: with a 1 August cut-off, 2026-03-15 is in the 2025/26 year.
 */
export const schoolYearFor = (
  date: string,
  cutoff: SchoolYearCutoff,
): SchoolYearRange => {
  const { schoolYearStartMonth: month, schoolYearStartDay: day } = cutoff;
  const [year, m, d] = date.split('-').map(Number);

  const startedThisYear = m > month || (m === month && d >= day);
  const startYear = startedThisYear ? year : year - 1;

  const start = isoDate(startYear, month, day);
  // The day before the next cut-off — avoids hardcoding month lengths and
  // handles leap years by construction.
  const nextStart = new Date(Date.UTC(startYear + 1, month - 1, day));
  nextStart.setUTCDate(nextStart.getUTCDate() - 1);
  const end = nextStart.toISOString().slice(0, 10);

  return {
    start,
    end,
    startYear,
    label: `${startYear}/${pad((startYear + 1) % 100)}`,
  };
};

/** The school year we are currently in. */
export const currentSchoolYear = (cutoff: SchoolYearCutoff): SchoolYearRange =>
  schoolYearFor(today(), cutoff);

/**
 * Whether a validity range (as stored on assignments and enrolments) covers
 * `date`. An open range — no `validTo` — runs indefinitely.
 */
export const isInForceOn = (
  range: { validFrom: string; validTo?: string | null },
  date: string,
): boolean =>
  range.validFrom <= date && (!range.validTo || range.validTo >= date);
