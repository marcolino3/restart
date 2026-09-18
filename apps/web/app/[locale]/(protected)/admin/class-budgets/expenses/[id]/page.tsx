import { getTranslations } from "next-intl/server";

import { ROUTES } from "@/constants/routes";
import { ClassExpenseForm } from "@/features/class-budgets/components/ClassExpenseForm";
import { loadExpenseForm } from "@/features/class-budgets/lib/load-expense-form";

interface Props {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ classId?: string; year?: string }>;
}

const EditClassExpensePage = async ({ params, searchParams }: Props) => {
  const t = await getTranslations("ClassBudgets");
  const { locale, id } = await params;
  const { classId, year } = await searchParams;
  const data = await loadExpenseForm({ classId, year, expenseId: id });

  if (!data.ok || !data.expense) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t(data.ok ? "expenseNotFound" : data.notice)}</p>
      </div>
    );
  }

  return (
    <ClassExpenseForm
      expense={data.expense}
      schoolClasses={data.schoolClasses}
      categories={data.categories}
      defaultSchoolClassId={data.schoolClassId}
      defaultExpenseDate={data.defaultExpenseDate}
      currency={data.currency}
      aiConfigured={data.aiConfigured}
      returnHref={`${ROUTES.admin.classBudgets(locale)}?classId=${data.schoolClassId}&year=${data.schoolYear.startYear}`}
    />
  );
};

export default EditClassExpensePage;
