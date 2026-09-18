import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

import {
  getClassBudgetSchoolYearsAction,
  getClassBudgetSummaryAction,
} from "../actions/class-budgets-actions";
import { getClassExpensesAction } from "../actions/class-expenses-actions";
import { getExpenseCategoriesAction } from "../actions/expense-categories-actions";
import { getExpenseAiConfiguredAction } from "../actions/expense-receipt-ai-actions";
import type { BudgetSchoolYear, ClassExpense, ExpenseCategory } from "../types";
import { userHasPermission } from "./permissions";
import { defaultExpenseDateFor, pickSchoolYear } from "./school-year";

export type ExpenseFormData =
  | { ok: false; notice: "selectOrganizationFirst" | "noAccess" | "noClasses" | "expenseNotFound" }
  | {
      ok: true;
      schoolClasses: { id: string; name: string }[];
      categories: ExpenseCategory[];
      schoolClassId: string;
      schoolYear: BudgetSchoolYear;
      defaultExpenseDate: string;
      currency: string;
      aiConfigured: boolean;
      expense?: ClassExpense;
    };

/**
 * Everything the expense page needs, for create and edit alike. Class and
 * year come from the URL; the backend only returns classes and expenses the
 * user may see, so an id of another org or class ends in "not found".
 */
export const loadExpenseForm = async (params: {
  classId?: string;
  year?: string;
  expenseId?: string;
}): Promise<ExpenseFormData> => {
  const userRes = await getCurrentUserAction();
  if (!userRes?.data?.orgId) return { ok: false, notice: "selectOrganizationFirst" };
  if (!userHasPermission(userRes.data, "CLASS_EXPENSE_WRITE")) {
    return { ok: false, notice: "noAccess" };
  }

  const [classesRes, schoolYears, categories, aiConfigured] = await Promise.all([
    getMyTeachingSchoolClassesAction(),
    getClassBudgetSchoolYearsAction(),
    getExpenseCategoriesAction(true),
    getExpenseAiConfiguredAction(),
  ]);
  const schoolClasses = (classesRes.success ? classesRes.data : []).map(
    ({ id, name }) => ({ id, name }),
  );
  if (schoolClasses.length === 0 || schoolYears.length === 0) {
    return { ok: false, notice: "noClasses" };
  }

  const schoolClass =
    schoolClasses.find((c) => c.id === params.classId) ?? schoolClasses[0];
  const schoolYear = pickSchoolYear(schoolYears, params.year) ?? schoolYears[0];

  const [summaryRes, expensesRes] = await Promise.all([
    getClassBudgetSummaryAction(schoolClass.id, schoolYear.startYear),
    params.expenseId
      ? getClassExpensesAction({
          schoolYearStart: schoolYear.startYear,
          schoolClassId: schoolClass.id,
          categoryId: null,
        })
      : null,
  ]);

  let expense: ClassExpense | undefined;
  if (params.expenseId) {
    expense = (expensesRes?.success ? expensesRes.data : []).find(
      (row) => row.id === params.expenseId,
    );
    if (!expense || !expense.canModify) {
      return { ok: false, notice: "expenseNotFound" };
    }
  }

  return {
    ok: true,
    schoolClasses,
    categories,
    schoolClassId: schoolClass.id,
    schoolYear,
    defaultExpenseDate: defaultExpenseDateFor(schoolYear),
    currency: summaryRes.success ? summaryRes.data.currency : "CHF",
    aiConfigured,
    expense,
  };
};
