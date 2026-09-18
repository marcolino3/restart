/**
 * Money maths for class budgets. Amounts live in `numeric(12,2)` columns and
 * travel as numbers, but every sum/difference is done in integer minor units
 * (Rappen/cents) so 0.1 + 0.2 never leaks into a balance.
 */

/** Converts a major-unit amount (number or pg numeric string) to minor units. */
export const toMinorUnits = (amount: number | string): number =>
  Math.round(Number(amount) * 100);

/** Converts minor units back to a major-unit amount with two decimals. */
export const fromMinorUnits = (minor: number): number => minor / 100;

/** TypeORM transformer for `numeric(12,2)` columns exposed as numbers. */
export const numericAmountTransformer = {
  to: (value?: number | null): number | null | undefined => value,
  from: (value?: string | null): number | null =>
    value === null || value === undefined ? null : Number(value),
};

/** True when `amount` has at most two decimal places. */
export const hasAtMostTwoDecimals = (amount: number): boolean =>
  Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6;
