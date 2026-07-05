import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeNotesAction } from "@/features/employee-notes/actions/get-employee-notes.action";
import { getEmployeeContractsAction } from "@/features/employees/actions/employee-contracts.actions";
import { getEmployeeReportAction } from "@/features/time-tracking/actions/get-time-report.action";
import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";
import EmployeeViewPage from "@/features/employees/components/EmployeeViewPage";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const ViewEmployeePage = async ({ params }: Props) => {
  await requireAdminPersona();
  const { employeeId } = await params;
  const t = await getTranslations("Employees");

  const [employeeResult, notesResult, contractsResult, report] =
    await Promise.all([
      getEmployeeByIdAction(employeeId),
      getEmployeeNotesAction(employeeId),
      getEmployeeContractsAction(employeeId),
      getEmployeeReportAction(employeeId),
    ]);

  if (!employeeResult.success || !employeeResult.data) {
    notFound();
  }

  const employee = employeeResult.data;
  const notes = notesResult.success ? notesResult.data : [];
  const contracts = contractsResult.success ? contractsResult.data : [];
  const employeeName = employee.membership?.user
    ? `${employee.membership.user.firstName} ${employee.membership.user.lastName}`
    : t("employees");

  return (
    <div className="space-y-6">
      <EmployeeViewPage
        employee={employee}
        notes={notes}
        contracts={contracts}
        report={report}
        employeeName={employeeName}
      />
    </div>
  );
};

export default ViewEmployeePage;
