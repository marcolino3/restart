import { getTranslations } from "next-intl/server";

import {
  getClassBudgetSchoolYearsAction,
  getClassBudgetSummaryAction,
} from "@/features/class-budgets/actions/class-budgets-actions";
import {
  AdminClassBudgetsTable,
  type AdminBudgetRow,
} from "@/features/class-budgets/components/AdminClassBudgetsTable";
import { BudgetEvaluation } from "@/features/class-budgets/components/BudgetEvaluation";
import { combineSummaries } from "@/features/class-budgets/lib/combine-summaries";
import { userHasPermission } from "@/features/class-budgets/lib/permissions";
import {
  budgetPlanningYears,
  pickSchoolYear,
} from "@/features/class-budgets/lib/school-year";
import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

interface Props {
  searchParams: Promise<{ year?: string }>;
}

const Notice = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
    <p>{text}</p>
  </div>
);

const ManageClassBudgetsPage = async ({ searchParams }: Props) => {
  const t = await getTranslations("ClassBudgets");
  const { year } = await searchParams;
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) return <Notice text={t("selectOrganizationFirst")} />;
  if (!userHasPermission(userRes.data, "CLASS_BUDGET_MANAGE")) {
    return <Notice text={t("noAccess")} />;
  }

  const [classesRes, schoolYears] = await Promise.all([
    getMyTeachingSchoolClassesAction(),
    getClassBudgetSchoolYearsAction(),
  ]);
  const schoolClasses = classesRes.success ? classesRes.data : [];
  const yearOptions = budgetPlanningYears(schoolYears);
  // The planning year is only selectable on request; default is the running year.
  const selected =
    yearOptions.find((option) => String(option.startYear) === year) ??
    pickSchoolYear(schoolYears, undefined);
  if (schoolClasses.length === 0 || !selected) {
    return <Notice text={t("noClasses")} />;
  }

  // One summary per class: budget and spending come from the same aggregation
  // the teacher view uses, so both screens always agree.
  const summaries = await Promise.all(
    schoolClasses.map((schoolClass) =>
      getClassBudgetSummaryAction(schoolClass.id, selected.startYear),
    ),
  );
  const rows: AdminBudgetRow[] = schoolClasses.map((schoolClass, index) => {
    const summary = summaries[index];
    return {
      schoolClassId: schoolClass.id,
      schoolClassName: schoolClass.name,
      budget: summary.success ? summary.data.budget : null,
      spent: summary.success ? summary.data.spent : 0,
      currency: summary.success ? summary.data.currency : "CHF",
    };
  });

  const total = combineSummaries(
    summaries.flatMap((summary) => (summary.success ? [summary.data] : [])),
  );

  return (
    <AdminClassBudgetsTable
      rows={rows}
      yearOptions={yearOptions}
      selectedStartYear={selected.startYear}
      evaluation={total && <BudgetEvaluation summary={total} />}
    />
  );
};

export default ManageClassBudgetsPage;
