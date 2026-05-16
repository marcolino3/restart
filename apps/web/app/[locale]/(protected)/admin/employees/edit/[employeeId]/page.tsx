import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import { getEmployeeAuditLogAction } from "@/features/employees/actions/get-employee-audit-log.action";
import { getEmployeeHrProfileAction } from "@/features/employees/actions/get-employee-hr-profile.action";
import { getEmployeeEmergencyProfileAction } from "@/features/employees/actions/get-employee-emergency-profile.action";
import { getEmployeeContractsAction } from "@/features/employees/actions/employee-contracts.actions";
import EmployeeEditView from "@/features/employees/components/EmployeeEditView";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const EditEmployeePage = async ({ params }: Props) => {
  const { employeeId } = await params;
  const t = await getTranslations("Employees");

  const [
    employeeResult,
    orgResult,
    auditLogResult,
    hrProfileResult,
    emergencyProfileResult,
    contractsResult,
  ] = await Promise.all([
    getEmployeeByIdAction(employeeId),
    getActiveOrganizationAction(),
    getEmployeeAuditLogAction(employeeId),
    getEmployeeHrProfileAction(employeeId),
    getEmployeeEmergencyProfileAction(employeeId),
    getEmployeeContractsAction(employeeId),
  ]);

  if (!employeeResult.success || !employeeResult.data) {
    notFound();
  }

  const employee = employeeResult.data;
  const orgCountry = orgResult.success ? (orgResult.data?.country ?? null) : null;
  const auditLog = auditLogResult.success ? auditLogResult.data : [];
  const hrProfile = hrProfileResult.success ? hrProfileResult.data : null;
  const emergencyProfile = emergencyProfileResult.success
    ? emergencyProfileResult.data
    : null;
  const contracts = contractsResult.success ? contractsResult.data : [];
  const employeeName = employee.membership?.user
    ? `${employee.membership.user.firstName} ${employee.membership.user.lastName}`
    : t("employees");

  return (
    <EmployeeEditView
      employee={employee}
      orgCountry={orgCountry}
      auditLog={auditLog}
      hrProfile={hrProfile}
      emergencyProfile={emergencyProfile}
      contracts={contracts}
      employeeName={employeeName}
    />
  );
};

export default EditEmployeePage;
