import type { BudgetSchoolYear } from "../types";

const toIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Default date for a new expense: today while the selected school year is
 * running, otherwise the year's last day — so an entry made while browsing an
 * older year lands in that year and stays visible in the list.
 */
export const defaultExpenseDateFor = (
  schoolYear: Pick<BudgetSchoolYear, "start" | "end">,
  now: Date = new Date(),
): string => {
  const today = toIsoDate(now);
  if (today < schoolYear.start) return schoolYear.start;
  if (today > schoolYear.end) return schoolYear.end;
  return today;
};

/**
 * The year to show: the one requested in the URL if it is selectable,
 * otherwise the running school year (the list is newest first and may start
 * with an already budgeted future year), otherwise the newest.
 */
export const pickSchoolYear = <T extends BudgetSchoolYear>(
  schoolYears: T[],
  requestedStartYear: string | undefined,
  now: Date = new Date(),
): T | undefined => {
  const today = toIsoDate(now);
  return (
    schoolYears.find((y) => String(y.startYear) === requestedStartYear) ??
    schoolYears.find((y) => y.start <= today && today <= y.end) ??
    schoolYears[0]
  );
};

export type SchoolYearOption = Pick<BudgetSchoolYear, "startYear" | "label">;

/**
 * Year options for budget planning: all browsable years plus the one after
 * the running year, so budgets can be set before the new school year starts.
 * The label of the extra year follows the org's label style ("2026/27" when
 * the school year spans two calendar years, otherwise "2026").
 */
export const budgetPlanningYears = (
  schoolYears: BudgetSchoolYear[],
  now: Date = new Date(),
): SchoolYearOption[] => {
  const running = pickSchoolYear(schoolYears, undefined, now);
  if (!running) return [];
  const nextStartYear = running.startYear + 1;
  if (schoolYears.some((y) => y.startYear === nextStartYear)) {
    return schoolYears;
  }
  const label = running.label.includes("/")
    ? `${nextStartYear}/${String((nextStartYear + 1) % 100).padStart(2, "0")}`
    : String(nextStartYear);
  return [{ startYear: nextStartYear, label }, ...schoolYears].sort(
    (a, b) => b.startYear - a.startYear,
  );
};
