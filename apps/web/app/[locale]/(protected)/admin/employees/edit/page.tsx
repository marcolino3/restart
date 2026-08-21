import { EmployeeOnboardingWizard } from "@/features/employees/components/wizard/EmployeeOnboardingWizard";
import { getEmployeeFunctionsAction } from "@/features/employee-functions/actions/get-employee-functions.action";
import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import { getRolesAction } from "@/features/roles/actions/get-roles.action";
import { buildRoleOptions } from "@/features/employees/lib/role-options";
import { getTeamsAction } from "@/features/teams/actions/get-teams.action";
import { requireAdminRole } from "@/features/users/guards/require-admin-role";
import { getTranslations } from "next-intl/server";

export default async function CreateEmployeePage() {
  await requireAdminRole();
  const t = await getTranslations("EmployeeOnboarding");

  const orgRes = await getActiveOrganizationAction();
  const org = orgRes.success ? orgRes.data : null;
  const orgCountry = org?.country ?? null;

  const [rolesRes, teamsRes, functionsRes] = await Promise.all([
    getRolesAction(),
    getTeamsAction(),
    getEmployeeFunctionsAction(),
  ]);

  const roleOptions = rolesRes.success
    ? buildRoleOptions(rolesRes.data, t)
    : [];

  const teamOptions = teamsRes.success
    ? teamsRes.data.map((tm) => ({ value: tm.id, label: tm.name }))
    : [];
  const employeeFunctions = functionsRes.success ? functionsRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <EmployeeOnboardingWizard
        orgCountry={orgCountry}
        roleOptions={roleOptions}
        teamOptions={teamOptions}
        employeeFunctions={employeeFunctions}
      />
    </div>
  );
}
