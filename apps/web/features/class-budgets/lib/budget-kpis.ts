import type { BudgetSchoolYear } from "../types";

export type BudgetTone = "green" | "amber" | "rose";

/** Traffic light of the spent share: calm below 80%, alarming from 95%. */
export const budgetTone = (percent: number): BudgetTone => {
  if (percent >= 95) return "rose";
  if (percent >= 80) return "amber";
  return "green";
};

/**
 * Calendar months left in the school year, the running month included.
 * Null outside the school year — a past or future year has no "per month".
 */
export const monthsLeft = (
  schoolYear: Pick<BudgetSchoolYear, "start" | "end">,
  now: Date,
): number | null => {
  const pad = (value: number) => String(value).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  if (today < schoolYear.start || today > schoolYear.end) return null;
  const [endYear, endMonth] = schoolYear.end.split("-").map(Number);
  return (endYear - now.getFullYear()) * 12 + (endMonth - (now.getMonth() + 1)) + 1;
};

/** Even split that never divides by zero; null when there is nobody to split for. */
export const perHead = (amount: number, heads: number): number | null =>
  heads > 0 ? Math.round((amount / heads) * 100) / 100 : null;
