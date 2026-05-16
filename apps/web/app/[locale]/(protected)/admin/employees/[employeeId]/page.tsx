import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeNotesAction } from "@/features/employee-notes/actions/get-employee-notes.action";
import { getEmployeeAuditLogAction } from "@/features/employees/actions/get-employee-audit-log.action";
import { getEmployeeHrProfileAction } from "@/features/employees/actions/get-employee-hr-profile.action";
import { getEmployeeEmergencyProfileAction } from "@/features/employees/actions/get-employee-emergency-profile.action";
import EmployeeViewPage from "@/features/employees/components/EmployeeViewPage";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const ViewEmployeePage = async ({ params }: Props) => {
  const { employeeId } = await params;
  const t = await getTranslations("Employees");

  const [
    employeeResult,
    notesResult,
    auditLogResult,
    hrProfileResult,
    emergencyProfileResult,
  ] = await Promise.all([
    getEmployeeByIdAction(employeeId),
    getEmployeeNotesAction(employeeId),
    getEmployeeAuditLogAction(employeeId),
    getEmployeeHrProfileAction(employeeId),
    getEmployeeEmergencyProfileAction(employeeId),
  ]);

  if (!employeeResult.success || !employeeResult.data) {
    notFound();
  }

  const employee = employeeResult.data;
  const notes = notesResult.success ? notesResult.data : [];
  const auditLog = auditLogResult.success ? auditLogResult.data : [];
  const hrProfile = hrProfileResult.success ? hrProfileResult.data : null;
  const emergencyProfile = emergencyProfileResult.success
    ? emergencyProfileResult.data
    : null;
  const employeeName = employee.membership?.user
    ? `${employee.membership.user.firstName} ${employee.membership.user.lastName}`
    : t("employees");

  return (
    <div className="space-y-6">
      <EmployeeViewPage
        employee={employee}
        notes={notes}
        auditLog={auditLog}
        hrProfile={hrProfile}
        emergencyProfile={emergencyProfile}
        employeeName={employeeName}
      />
    </div>
  );
};

export default ViewEmployeePage;
