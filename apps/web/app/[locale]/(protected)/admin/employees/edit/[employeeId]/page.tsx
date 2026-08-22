import { EmployeeOnboardingWizard } from "@/features/employees/components/wizard/EmployeeOnboardingWizard";
import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeContractsAction } from "@/features/employees/actions/employee-contracts.actions";
import { getEmployeeFunctionsAction } from "@/features/employee-functions/actions/get-employee-functions.action";
import { mapEmployeeToOnboardingForm } from "@/features/employees/lib/map-employee-to-onboarding-form";
import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import { getRolesAction } from "@/features/roles/actions/get-roles.action";
import { buildRoleOptions } from "@/features/employees/lib/role-options";
import { getTeamsAction } from "@/features/teams/actions/get-teams.action";
import { requireAdminRole } from "@/features/users/guards/require-admin-role";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const EditEmployeePage = async ({ params }: Props) => {
  await requireAdminRole();
  const { employeeId } = await params;
  const locale = await getLocale();
  const t = await getTranslations("EmployeeOnboarding");

  const [employeeResult, orgResult, contractsResult, functionsResult] =
    await Promise.all([
      getEmployeeByIdAction(employeeId),
      getActiveOrganizationAction(),
      getEmployeeContractsAction(employeeId),
      getEmployeeFunctionsAction(),
    ]);

  // Distinguish "not found" from transport/auth failures — the latter used to
  // surface as a blank 404 whenever the backend was briefly unreachable.
  if (!employeeResult.success) {
    throw new Error(employeeResult.error ?? "Failed to load employee");
  }
  if (!employeeResult.data) {
    notFound();
  }

  const employee = employeeResult.data;
  const orgCountry = orgResult.success ? (orgResult.data?.country ?? null) : null;
  const contracts = contractsResult.success ? contractsResult.data : [];
  const employeeFunctions = functionsResult.success ? functionsResult.data : [];
  const teamId =
    employee.teamMembers?.find((tm) => tm.team?.id)?.team?.id ?? null;

  const initialValues = mapEmployeeToOnboardingForm({
    employee,
    contracts,
    teamId,
    orgCountry,
    locale,
    employeeFunctions,
  });

  const [rolesRes, teamsRes] = await Promise.all([
    getRolesAction(),
    getTeamsAction(),
  ]);

  const roleOptions = rolesRes.success
    ? buildRoleOptions(rolesRes.data, t)
    : [];

  const teamOptions = teamsRes.success
    ? teamsRes.data.map((tm) => ({ value: tm.id, label: tm.name }))
    : [];

  const isDraft = employee.status === "DRAFT";
  const employeeName = employee.membership?.user
    ? `${employee.membership.user.firstName} ${employee.membership.user.lastName}`
    : t("editTitle");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isDraft ? t("resumeTitle") : t("editTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isDraft
            ? t("resumeSubtitle", { name: employeeName })
            : t("editSubtitle", { name: employeeName })}
        </p>
      </div>
      <EmployeeOnboardingWizard
        orgCountry={orgCountry}
        roleOptions={roleOptions}
        teamOptions={teamOptions}
        employeeFunctions={employeeFunctions}
        initialValues={initialValues}
        employeeStatus={employee.status as "DRAFT" | "ACTIVE"}
      />
    </div>
  );
};

export default EditEmployeePage;
