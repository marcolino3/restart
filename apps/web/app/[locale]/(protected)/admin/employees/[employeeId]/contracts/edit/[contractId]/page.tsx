import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/common/BackButton";
import { ROUTES } from "@/constants/routes";
import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeContractsAction } from "@/features/employees/actions/employee-contracts.actions";
import { EmployeeContractForm } from "@/features/employees/components/EmployeeContractForm";
import { getEmployeeFunctionsAction } from "@/features/employee-functions/actions/get-employee-functions.action";
import { mapEmployeeFunctionsToOptions } from "@/features/employee-functions/lib/map-employee-functions-to-options";
import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";

interface Props {
  params: Promise<{ employeeId: string; contractId: string }>;
}

const EditEmployeeContractPage = async ({ params }: Props) => {
  await requireAdminPersona();
  const { employeeId, contractId } = await params;
  const t = await getTranslations("Employees");
  const locale = await getLocale();

  const [employeeResult, contractsResult, functionsResult] = await Promise.all([
    getEmployeeByIdAction(employeeId),
    getEmployeeContractsAction(employeeId),
    getEmployeeFunctionsAction(),
  ]);

  if (!employeeResult.success || !employeeResult.data) {
    notFound();
  }

  const contract = contractsResult.success
    ? contractsResult.data.find((c) => c.id === contractId)
    : undefined;
  if (!contract) {
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
        contract={contract}
        functionOptions={functionOptions}
        firstName={firstName}
        lastName={lastName}
        title={t("contract.edit")}
        returnHref={contractsHref}
      />
    </div>
  );
};

export default EditEmployeeContractPage;
