import { getTranslations } from "next-intl/server";

import { ROUTES } from "@/constants/routes";
import { ClassExpenseForm } from "@/features/class-budgets/components/ClassExpenseForm";
import { loadExpenseForm } from "@/features/class-budgets/lib/load-expense-form";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ classId?: string; year?: string }>;
}

const NewClassExpensePage = async ({ params, searchParams }: Props) => {
  const t = await getTranslations("ClassBudgets");
  const { locale } = await params;
  const { classId, year } = await searchParams;
  const data = await loadExpenseForm({ classId, year });

  if (!data.ok) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t(data.notice)}</p>
      </div>
    );
  }

  return (
    <ClassExpenseForm
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

export default NewClassExpensePage;
