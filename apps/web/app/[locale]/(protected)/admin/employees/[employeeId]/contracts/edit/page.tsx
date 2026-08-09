import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/common/BackButton";
import { ROUTES } from "@/constants/routes";
import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { EmployeeContractForm } from "@/features/employees/components/EmployeeContractForm";
import { getEmployeeFunctionsAction } from "@/features/employee-functions/actions/get-employee-functions.action";
import { mapEmployeeFunctionsToOptions } from "@/features/employee-functions/lib/map-employee-functions-to-options";
import { requireAdminRole } from "@/features/users/guards/require-admin-role";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const CreateEmployeeContractPage = async ({ params }: Props) => {
  await requireAdminRole();
  const { employeeId } = await params;
  const t = await getTranslations("Employees");
  const locale = await getLocale();

  const [employeeResult, functionsResult] = await Promise.all([
    getEmployeeByIdAction(employeeId),
    getEmployeeFunctionsAction(),
  ]);

  if (!employeeResult.success || !employeeResult.data) {
    notFound();
  }

  const employee = employeeResult.data;
  const employeeFunctions = functionsResult.success ? functionsResult.data : [];
  const functionOptions = mapEmployeeFunctionsToOptions(
    employeeFunctions,
    locale,
  );
  const firstName = employee.membership?.user?.firstName ?? null;
  const lastName = employee.membership?.user?.lastName ?? null;

  const contractsHref = `${ROUTES.admin.employeesView(locale, employeeId)}?tab=contracts`;

  return (
    <div className="flex flex-col gap-4 p-4">
      <BackButton href={contractsHref} label={t("contract.backToContracts")} />
      <EmployeeContractForm
        employeeId={employeeId}
        functionOptions={functionOptions}
        firstName={firstName}
        lastName={lastName}
        title={t("contract.create")}
        returnHref={contractsHref}
      />
    </div>
  );
};

export default CreateEmployeeContractPage;
