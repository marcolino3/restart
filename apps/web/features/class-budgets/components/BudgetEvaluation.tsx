"use client";

import { useTranslations } from "next-intl";

import type { ClassBudgetSummary } from "../types";
import { ClassBudgetSummaryCards } from "./ClassBudgetSummaryCards";
import { ExpenseCategoryPie } from "./ExpenseCategoryPie";

interface Props {
  /** All classes of the school year folded into one summary. */
  summary: ClassBudgetSummary;
}

export function BudgetEvaluation({ summary }: Props) {
  const t = useTranslations("ClassBudgets");

  return (
    <section className="space-y-4" data-testid="budget-evaluation">
      <h2 className="text-base font-semibold">
        {t("evaluationTitle", { label: summary.schoolYear.label })}
      </h2>
      <ClassBudgetSummaryCards summary={summary} />
      <ExpenseCategoryPie summary={summary} />
    </section>
  );
}
