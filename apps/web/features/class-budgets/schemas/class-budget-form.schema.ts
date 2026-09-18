import { z } from "zod";

import {
  EXPENSE_MAX_AMOUNT,
  hasAtMostTwoDecimals,
} from "./class-expense-form.schema";

/** A budget may be zero (class without money) but never negative. */
export const classBudgetAmountSchema = z
  .number()
  .min(0)
  .max(EXPENSE_MAX_AMOUNT)
  .refine(hasAtMostTwoDecimals);

/**
 * Parses the inline budget input. Accepts "1500", "1500.50", "1'500.50" and a
 * decimal comma; returns null for anything that is not a valid amount.
 */
export const parseBudgetAmount = (raw: string): number | null => {
  const normalised = raw.trim().replace(/['’\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalised)) return null;
  const parsed = classBudgetAmountSchema.safeParse(Number(normalised));
  return parsed.success ? parsed.data : null;
};
