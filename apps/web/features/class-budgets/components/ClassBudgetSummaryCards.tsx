"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

import { StatCard, StatCardEm } from "@/components/common/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import {
  budgetTone,
  monthsLeft,
  perHead,
  type BudgetTone,
} from "../lib/budget-kpis";
import { formatMoney, spentPercent } from "../lib/format-money";
import type { ClassBudgetSummary } from "../types";

const TONE_CLASS: Record<BudgetTone, string> = {
  green: "bg-status-green-foreground",
  amber: "bg-status-amber-foreground",
  rose: "bg-status-rose-foreground",
};

interface Props {
  summary: ClassBudgetSummary;
}

export function ClassBudgetSummaryCards({ summary }: Props) {
  const t = useTranslations("ClassBudgets");
  const locale = useLocale();
  const money = (amount: number) =>
    formatMoney(amount, summary.currency, locale);
  const percent = spentPercent(summary.spent, summary.budget);
  const months = monthsLeft(summary.schoolYear, new Date());
  const spentPerChild = perHead(summary.spent, summary.studentCount);
  const budgetPerChild =
    summary.budget === null
      ? null
      : perHead(summary.budget, summary.studentCount);
  const bookings = t("bookings", { count: summary.expenseCount });

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
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
            percent === null ? (
              bookings
            ) : (
              <>
                <span
                  className="mb-2 block h-2 overflow-hidden rounded-full bg-field"
                  role="progressbar"
                  aria-label={t("spent")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(percent, 100)}
                  data-testid="budget-progress"
                  data-tone={budgetTone(percent)}
                >
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      TONE_CLASS[budgetTone(percent)],
                    )}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </span>
                <StatCardEm>{percent}%</StatCardEm> {t("ofBudget")} · {bookings}
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
          sub={
            summary.isOverBudget
              ? t("overBudgetTitle")
              : summary.budget !== null && months !== null
                ? t("remainingPerMonth", {
                    count: months,
                    amount: money(perHead(summary.remaining, months) ?? 0),
                  })
                : undefined
          }
        />
        <StatCard
          label={t("perChild")}
          value={spentPerChild === null ? "—" : money(spentPerChild)}
          sub={
            summary.studentCount === 0
              ? t("noChildren")
              : budgetPerChild === null
                ? t("children", { count: summary.studentCount })
                : `${t("children", { count: summary.studentCount })} · ${t(
                    "budgetPerChild",
                    { amount: money(budgetPerChild) },
                  )}`
          }
        />
      </div>
    </div>
  );
}
