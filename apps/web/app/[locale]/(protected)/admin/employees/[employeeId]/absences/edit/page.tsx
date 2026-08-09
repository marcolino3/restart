import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/common/BackButton";
import { ROUTES } from "@/constants/routes";
import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeAbsenceCategoriesAction } from "@/features/employee-absence-categories/actions/get-employee-absence-categories.action";
import { EmployeeAbsenceForm } from "@/features/employee-absences/components/EmployeeAbsenceForm";
import { requireAdminRole } from "@/features/users/guards/require-admin-role";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const CreateEmployeeAbsencePage = async ({ params }: Props) => {
  await requireAdminRole();
  const { employeeId } = await params;
  const t = await getTranslations("Employees");
  const locale = await getLocale();

  const [employeeResult, categoriesResult] = await Promise.all([
    getEmployeeByIdAction(employeeId),
    getEmployeeAbsenceCategoriesAction(),
  ]);

  if (!employeeResult.success || !employeeResult.data) {
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
        categories={categories}
        firstName={firstName}
        lastName={lastName}
        title={t("absence.create")}
        returnHref={absencesHref}
      />
    </div>
  );
};

export default CreateEmployeeAbsencePage;
