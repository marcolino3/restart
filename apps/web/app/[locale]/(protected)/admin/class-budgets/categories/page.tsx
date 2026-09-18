import { getTranslations } from "next-intl/server";

import { getExpenseCategoriesAction } from "@/features/class-budgets/actions/expense-categories-actions";
import { ExpenseCategoriesManager } from "@/features/class-budgets/components/ExpenseCategoriesManager";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

const ExpenseCategoriesPage = async () => {
  const t = await getTranslations("ExpenseCategories");
  const userRes = await getCurrentUserAction();

  if (
    !userRes?.data?.orgId ||
    !userRes.data.permissions.includes("CLASS_BUDGET_MANAGE")
  ) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t("noAccess")}</p>
      </div>
    );
  }

  const categories = await getExpenseCategoriesAction();
  return <ExpenseCategoriesManager categories={categories} />;
};

export default ExpenseCategoriesPage;
