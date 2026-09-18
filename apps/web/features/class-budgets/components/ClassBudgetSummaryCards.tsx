"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

import { StatCard, StatCardEm } from "@/components/common/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { formatMoney, spentPercent } from "../lib/format-money";
import type { ClassBudgetSummary } from "../types";

interface Props {
  summary: ClassBudgetSummary;
}

export function ClassBudgetSummaryCards({ summary }: Props) {
  const t = useTranslations("ClassBudgets");
  const locale = useLocale();
  const money = (amount: number) =>
    formatMoney(amount, summary.currency, locale);
  const percent = spentPercent(summary.spent, summary.budget);

  return (
    <div className="space-y-4">
      {summary.isOverBudget && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("overBudgetTitle")}</AlertTitle>
          <AlertDescription>
            {t("overBudgetText", { amount: money(-summary.remaining) })}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t("budget")}
          value={summary.budget === null ? "—" : money(summary.budget)}
          sub={
            summary.budget === null
              ? t("noBudgetSet")
              : t("schoolYearLabel", { label: summary.schoolYear.label })
          }
        />
        <StatCard
          label={t("spent")}
          value={money(summary.spent)}
          sub={
            percent === null ? undefined : (
              <>
                <StatCardEm>{percent}%</StatCardEm> {t("ofBudget")}
              </>
            )
          }
        />
        <StatCard
          label={t("remaining")}
          value={
            summary.budget === null ? (
              "—"
            ) : (
              <span
                className={summary.isOverBudget ? "text-destructive" : undefined}
                data-testid="budget-remaining"
              >
                {money(summary.remaining)}
              </span>
            )
          }
          sub={summary.isOverBudget ? t("overBudgetTitle") : undefined}
        />
      </div>
    </div>
  );
}
