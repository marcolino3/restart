"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  BudgetSchoolYear,
  ClassBudgetSummary,
  ClassExpense,
  ExpenseCategory,
} from "../types";
import { ClassBudgetSummaryCards } from "./ClassBudgetSummaryCards";
import { ClassExpenseDialog } from "./ClassExpenseDialog";
import { ClassExpensesTable } from "./ClassExpensesTable";
import { ExpenseCategoryPie } from "./ExpenseCategoryPie";

const ALL_CATEGORIES = "all";

interface Props {
  schoolClasses: { id: string; name: string }[];
  schoolYears: BudgetSchoolYear[];
  categories: ExpenseCategory[];
  selectedSchoolClassId: string;
  selectedSchoolYear: BudgetSchoolYear;
  selectedCategoryId: string | null;
  /** Today when it lies in the selected year, otherwise the year's last day. */
  defaultExpenseDate: string;
  canWrite: boolean;
  summary: ClassBudgetSummary | null;
  expenses: ClassExpense[];
}

type DialogState = { mode: "create" } | { mode: "edit"; expense: ClassExpense };

export function ClassBudgetsOverview({
  schoolClasses,
  schoolYears,
  categories,
  selectedSchoolClassId,
  selectedSchoolYear,
  selectedCategoryId,
  defaultExpenseDate,
  canWrite,
  summary,
  expenses,
}: Props) {
  const t = useTranslations("ClassBudgets");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialog, setDialog] = useState<DialogState | null>(null);

  // The selection lives in the URL so the server component loads the data
  // and a reload or shared link keeps class, year and filter.
  const select = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={selectedSchoolClassId}
          onValueChange={(value) => select("classId", value)}
        >
          <SelectTrigger className="w-[220px]" aria-label={t("schoolClass")}>
            <SelectValue placeholder={t("schoolClass")} />
          </SelectTrigger>
          <SelectContent>
            {schoolClasses.map((schoolClass) => (
              <SelectItem key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(selectedSchoolYear.startYear)}
          onValueChange={(value) => select("year", value)}
        >
          <SelectTrigger className="w-[160px]" aria-label={t("schoolYear")}>
            <SelectValue placeholder={t("schoolYear")} />
          </SelectTrigger>
          <SelectContent>
            {schoolYears.map((year) => (
              <SelectItem key={year.startYear} value={String(year.startYear)}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedCategoryId ?? ALL_CATEGORIES}
          onValueChange={(value) =>
            select("categoryId", value === ALL_CATEGORIES ? null : value)
          }
        >
          <SelectTrigger className="w-[200px]" aria-label={t("category")}>
            <SelectValue placeholder={t("category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>{t("allCategories")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canWrite && (
          <Button
            className="ml-auto"
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("newExpense")}
          </Button>
        )}
      </div>

      {summary && (
        <>
          <ClassBudgetSummaryCards summary={summary} />
          <ExpenseCategoryPie summary={summary} />
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          {t("expensesTitle", { label: selectedSchoolYear.label })}
        </h2>
        <ClassExpensesTable
          expenses={expenses}
          onEdit={(expense) => setDialog({ mode: "edit", expense })}
          onDeleted={() => router.refresh()}
        />
      </section>

      {dialog && (
        <ClassExpenseDialog
          expense={dialog.mode === "edit" ? dialog.expense : undefined}
          schoolClasses={schoolClasses}
          categories={categories}
          defaultSchoolClassId={selectedSchoolClassId}
          defaultExpenseDate={defaultExpenseDate}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
