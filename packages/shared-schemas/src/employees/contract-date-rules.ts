import { z } from "zod";

/** Calendar-day timestamp so time-of-day does not affect comparisons. */
export function toUtcDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export const END_DATE_BEFORE_START_MESSAGE =
  "Enddatum darf nicht vor dem Startdatum liegen";

/**
 * Adds a Zod issue on `endDate` when it falls on a calendar day before
 * `startDate`. Equal days are allowed.
 */
export function refineEndDateNotBeforeStart(
  values: { startDate?: Date | null; endDate?: Date | null },
  ctx: z.RefinementCtx,
): void {
  const { startDate, endDate } = values;
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return;
  }
  if (toUtcDay(endDate) < toUtcDay(startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: END_DATE_BEFORE_START_MESSAGE,
    });
  }
}
