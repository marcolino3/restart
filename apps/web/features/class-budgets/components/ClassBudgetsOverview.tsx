"use client";

import { useDeferredValue, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Plus } from "lucide-react";

import { PageHead } from "@/components/common/PageHead";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
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
import { ClassExpensesTable } from "./ClassExpensesTable";
import { ExpenseCategoryPie } from "./ExpenseCategoryPie";
import { expensesToCsv, filterExpenses } from "../lib/expenses-csv";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = "all";

// Filter pill from the design handoff; `on` marks a filter that narrows the list.
const pill = (on = false) =>
  cn(
    "h-[34px] w-auto gap-2 rounded-full bg-card px-3.5 text-[13px] font-medium",
    on && "border-primary bg-accent text-accent-foreground",
  );

interface Props {
  schoolClasses: { id: string; name: string }[];
  schoolYears: BudgetSchoolYear[];
  categories: ExpenseCategory[];
  selectedSchoolClassId: string;
  selectedSchoolYear: BudgetSchoolYear;
  selectedCategoryId: string | null;
  canWrite: boolean;
  summary: ClassBudgetSummary | null;
  expenses: ClassExpense[];
}

export function ClassBudgetsOverview({
  schoolClasses,
  schoolYears,
  categories,
  selectedSchoolClassId,
  selectedSchoolYear,
  selectedCategoryId,
  canWrite,
  summary,
  expenses,
}: Props) {
  const t = useTranslations("ClassBudgets");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Recording and editing happen on their own page, which returns to the
  // same class and year.
  const expenseQuery = `classId=${selectedSchoolClassId}&year=${selectedSchoolYear.startYear}`;

  // The selection lives in the URL so the server component loads the data
  // and a reload or shared link keeps class, year and filter.
  const select = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const [query, setQuery] = useState("");
  const visibleExpenses = filterExpenses(expenses, useDeferredValue(query));
  const newExpenseHref = `${ROUTES.admin.classExpenseNew(locale)}?${expenseQuery}`;
  const selectedClassName =
    schoolClasses.find((c) => c.id === selectedSchoolClassId)?.name ?? "";

  const exportCsv = () => {
    const csv = expensesToCsv(visibleExpenses, {
      expenseDate: t("expenseDate"),
      category: t("category"),
      vendor: t("vendor"),
      invoiceNumber: t("invoiceNumber"),
      description: t("description"),
      amount: t("amount"),
      currency: t("currency"),
    });
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${t("exportFileName")}-${selectedClassName}-${selectedSchoolYear.label}.csv`
      .replaceAll("/", "-")
      .replaceAll(" ", "_");
    link.click();
    URL.revokeObjectURL(url);
  };

  const newExpenseButton = canWrite && (
    <Button onClick={() => router.push(newExpenseHref)}>
      <Plus className="mr-1 h-4 w-4" />
      {t("newExpense")}
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHead
        className="mb-0"
        title={t("pageTitle")}
        subtitle={t("pageSubtitle", {
          name: selectedClassName,
          label: selectedSchoolYear.label,
        })}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              onClick={exportCsv}
              disabled={visibleExpenses.length === 0}
            >
              <Download className="mr-1 h-4 w-4" />
              {t("export")}
            </Button>
            {newExpenseButton}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <Select
          value={selectedSchoolClassId}
          onValueChange={(value) => select("classId", value)}
        >
          <SelectTrigger className={pill()} aria-label={t("schoolClass")}>
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
          <SelectTrigger className={pill()} aria-label={t("schoolYear")}>
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
          <SelectTrigger
            className={pill(selectedCategoryId !== null)}
            aria-label={t("category")}
          >
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
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("searchPlaceholder")}
          containerClassName="ml-auto w-[240px]"
        />
      </div>

      {summary && (
        <>
          <ClassBudgetSummaryCards summary={summary} />
          {summary.spent > 0 && <ExpenseCategoryPie summary={summary} />}
        </>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-[15px] font-[650]">
          {t("expensesTitle", { label: selectedSchoolYear.label })}
          <span
            className="rounded-full bg-accent px-2 py-0.5 font-mono text-[11px] font-semibold text-accent-foreground"
            data-testid="expenses-count"
          >
            {visibleExpenses.length}
          </span>
        </h2>
        <ClassExpensesTable
          expenses={visibleExpenses}
          empty={
            expenses.length > 0 || selectedCategoryId !== null ? (
              <p>{t("noExpensesMatch")}</p>
            ) : (
              <>
                <p>{t("noExpensesInYear")}</p>
                {newExpenseButton}
              </>
            )
          }
          onEdit={(expense) =>
            router.push(
              `${ROUTES.admin.classExpenseEdit(locale, expense.id)}?${expenseQuery}`,
            )
          }
          onDeleted={() => router.refresh()}
        />
      </section>
    </div>
  );
}
