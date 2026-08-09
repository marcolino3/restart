import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/common/BackButton";
import { ROUTES } from "@/constants/routes";
import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeAbsenceCategoriesAction } from "@/features/employee-absence-categories/actions/get-employee-absence-categories.action";
import { getEmployeeAbsenceByIdAction } from "@/features/employee-absences/actions/employee-absences.actions";
import { EmployeeAbsenceForm } from "@/features/employee-absences/components/EmployeeAbsenceForm";
import { requireAdminRole } from "@/features/users/guards/require-admin-role";

interface Props {
  params: Promise<{ employeeId: string; absenceId: string }>;
}

const EditEmployeeAbsencePage = async ({ params }: Props) => {
  await requireAdminRole();
  const { employeeId, absenceId } = await params;
  const t = await getTranslations("Employees");
  const locale = await getLocale();

  const [employeeResult, absenceResult, categoriesResult] = await Promise.all([
    getEmployeeByIdAction(employeeId),
    getEmployeeAbsenceByIdAction(absenceId),
    getEmployeeAbsenceCategoriesAction(),
  ]);

  if (!employeeResult.success || !employeeResult.data) {
    notFound();
  }

  const absence = absenceResult.success ? absenceResult.data : null;
  if (!absence || absence.employeeId !== employeeId) {
    notFound();
  }

  const categories = categoriesResult.success ? categoriesResult.data : [];
  const absencesHref = `${ROUTES.admin.employeesView(locale, employeeId)}?tab=absences`;
  const firstName = employeeResult.data.membership?.user?.firstName ?? null;
  const lastName = employeeResult.data.membership?.user?.lastName ?? null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <BackButton href={absencesHref} label={t("absence.backToAbsences")} />
      <EmployeeAbsenceForm
        employeeId={employeeId}
        absence={absence}
        categories={categories}
        firstName={firstName}
        lastName={lastName}
        title={t("absence.edit")}
        returnHref={absencesHref}
      />
    </div>
  );
};

export default EditEmployeeAbsencePage;
