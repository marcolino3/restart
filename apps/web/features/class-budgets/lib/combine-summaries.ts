import type { ClassBudgetSummary } from "../types";

// Money is summed in cents so many classes never drift by float rounding.
const toCents = (amount: number) => Math.round(amount * 100);

/**
 * Folds the per-class summaries of one school year into one summary for the
 * whole organisation. The inputs already are org-scoped aggregations, so the
 * evaluation always agrees with the class views. Returns null without input.
 */
export function combineSummaries(
  summaries: ClassBudgetSummary[],
): ClassBudgetSummary | null {
  const first = summaries[0];
  if (!first) return null;

  let budgetCents: number | null = null;
  let spentCents = 0;
  const categories = new Map<
    string,
    { category: ClassBudgetSummary["byCategory"][number]["category"]; cents: number }
  >();

  for (const summary of summaries) {
    if (summary.budget !== null) {
      budgetCents = (budgetCents ?? 0) + toCents(summary.budget);
    }
    spentCents += toCents(summary.spent);
    for (const row of summary.byCategory) {
      const entry = categories.get(row.category.id);
      if (entry) entry.cents += toCents(row.total);
      else {
        categories.set(row.category.id, {
          category: row.category,
          cents: toCents(row.total),
        });
      }
    }
  }

  const remainingCents = budgetCents === null ? 0 : budgetCents - spentCents;
  return {
    schoolClassId: "",
    schoolYear: first.schoolYear,
    budget: budgetCents === null ? null : budgetCents / 100,
    spent: spentCents / 100,
    remaining: remainingCents / 100,
    isOverBudget: budgetCents !== null && remainingCents < 0,
    currency: first.currency,
    expenseCount: summaries.reduce((sum, s) => sum + s.expenseCount, 0),
    studentCount: summaries.reduce((sum, s) => sum + s.studentCount, 0),
    byCategory: [...categories.values()]
      .map((entry) => ({ category: entry.category, total: entry.cents / 100 }))
      .sort((a, b) => b.total - a.total),
  };
}
