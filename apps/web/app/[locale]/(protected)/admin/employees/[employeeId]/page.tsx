import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeNotesAction } from "@/features/employee-notes/actions/get-employee-notes.action";
import EmployeeViewPage from "@/features/employees/components/EmployeeViewPage";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const ViewEmployeePage = async ({ params }: Props) => {
  const { employeeId } = await params;
  const t = await getTranslations("Employees");

  const [employeeResult, notesResult] = await Promise.all([
    getEmployeeByIdAction(employeeId),
    getEmployeeNotesAction(employeeId),
  ]);

  if (!employeeResult.success || !employeeResult.data) {
    notFound();
  }

  const employee = employeeResult.data;
  const notes = notesResult.success ? notesResult.data : [];
  const employeeName = employee.membership?.user
    ? `${employee.membership.user.firstName} ${employee.membership.user.lastName}`
    : t("employees");

  return (
    <div className="space-y-6">
      <EmployeeViewPage
        employee={employee}
        notes={notes}
        employeeName={employeeName}
      />
    </div>
  );
};

export default ViewEmployeePage;
