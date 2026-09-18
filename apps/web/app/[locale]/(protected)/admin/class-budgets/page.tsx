import { getTranslations } from "next-intl/server";

import {
  getClassBudgetSchoolYearsAction,
  getClassBudgetSummaryAction,
} from "@/features/class-budgets/actions/class-budgets-actions";
import { getClassExpensesAction } from "@/features/class-budgets/actions/class-expenses-actions";
import { getExpenseCategoriesAction } from "@/features/class-budgets/actions/expense-categories-actions";
import { ClassBudgetsOverview } from "@/features/class-budgets/components/ClassBudgetsOverview";
import { userHasPermission } from "@/features/class-budgets/lib/permissions";
import { pickSchoolYear } from "@/features/class-budgets/lib/school-year";
import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

interface Props {
  searchParams: Promise<{
    classId?: string;
    year?: string;
    categoryId?: string;
  }>;
}

const Notice = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
    <p>{text}</p>
  </div>
);

const ClassBudgetsPage = async ({ searchParams }: Props) => {
  const t = await getTranslations("ClassBudgets");
  const { classId, year } = await searchParams;
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) return <Notice text={t("selectOrganizationFirst")} />;
  if (!userHasPermission(userRes.data, "CLASS_EXPENSE_READ")) {
    return <Notice text={t("noAccess")} />;
  }

  // The backend only returns classes this user may see (teachers: their own).
  const [classesRes, schoolYears, categories] = await Promise.all([
    getMyTeachingSchoolClassesAction(),
    getClassBudgetSchoolYearsAction(),
    getExpenseCategoriesAction(true),
  ]);
  const schoolClasses = (classesRes.success ? classesRes.data : []).map(
    ({ id, name }) => ({ id, name }),
  );
  if (schoolClasses.length === 0 || schoolYears.length === 0) {
    return <Notice text={t("noClasses")} />;
  }

  // Unknown ids from the URL fall back to the first entry instead of erroring.
  const selectedClass =
    schoolClasses.find((c) => c.id === classId) ?? schoolClasses[0];
  const selectedYear = pickSchoolYear(schoolYears, year) ?? schoolYears[0];

  const canWrite = userHasPermission(userRes.data, "CLASS_EXPENSE_WRITE");
  const [summaryRes, expensesRes] = await Promise.all([
    getClassBudgetSummaryAction(selectedClass.id, selectedYear.startYear),
    getClassExpensesAction({
      schoolYearStart: selectedYear.startYear,
      schoolClassId: selectedClass.id,
    }),
  ]);

  return (
    <ClassBudgetsOverview
      schoolClasses={schoolClasses}
      schoolYears={schoolYears}
      categories={categories}
      selectedSchoolClassId={selectedClass.id}
      selectedSchoolYear={selectedYear}
      canWrite={canWrite}
      summary={summaryRes.success ? summaryRes.data : null}
      expenses={expensesRes.success ? expensesRes.data : []}
    />
  );
};

export default ClassBudgetsPage;
