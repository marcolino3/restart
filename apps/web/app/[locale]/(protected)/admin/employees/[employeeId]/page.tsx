import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeNotesAction } from "@/features/employee-notes/actions/get-employee-notes.action";
import { getEmployeeContractsAction } from "@/features/employees/actions/employee-contracts.actions";
import { getEmployeeAbsencesAction } from "@/features/employee-absences/actions/employee-absences.actions";
import { getEmployeeReportAction } from "@/features/time-tracking/actions/get-time-report.action";
import { getEmployeeFunctionsAction } from "@/features/employee-functions/actions/get-employee-functions.action";
import { mapEmployeeFunctionsToOptions } from "@/features/employee-functions/lib/map-employee-functions-to-options";
import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";
import EmployeeViewPage from "@/features/employees/components/EmployeeViewPage";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const ViewEmployeePage = async ({ params }: Props) => {
  await requireAdminPersona();
  const { employeeId } = await params;
  const t = await getTranslations("Employees");
  const locale = await getLocale();

  const [
    employeeResult,
    notesResult,
    contractsResult,
    absencesResult,
    report,
    functionsResult,
  ] = await Promise.all([
    getEmployeeByIdAction(employeeId),
    getEmployeeNotesAction(employeeId),
    getEmployeeContractsAction(employeeId),
    getEmployeeAbsencesAction(employeeId),
    getEmployeeReportAction(employeeId),
    getEmployeeFunctionsAction(),
  ]);

  if (!employeeResult.success) {
    throw new Error(employeeResult.error ?? "Failed to load employee");
  }
  if (!employeeResult.data) {
    notFound();
  }

  const employee = employeeResult.data;
  const notes = notesResult.success ? notesResult.data : [];
  const contracts = contractsResult.success ? contractsResult.data : [];
  const absences = absencesResult.success ? absencesResult.data : [];
  const employeeFunctions = functionsResult.success ? functionsResult.data : [];
  const functionOptions = mapEmployeeFunctionsToOptions(
    employeeFunctions,
    locale,
  );
  const employeeName = employee.membership?.user
    ? `${employee.membership.user.firstName} ${employee.membership.user.lastName}`
    : t("employees");

  return (
    <div className="space-y-6">
      <EmployeeViewPage
        employee={employee}
        notes={notes}
        contracts={contracts}
        absences={absences}
        report={report}
        employeeName={employeeName}
        functionOptions={functionOptions}
      />
    </div>
  );
};

export default ViewEmployeePage;
