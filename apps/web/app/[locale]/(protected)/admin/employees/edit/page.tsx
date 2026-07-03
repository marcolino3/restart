import { EmployeeOnboardingWizard } from "@/features/employees/components/wizard/EmployeeOnboardingWizard";
import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import { getRolesByOrgAction } from "@/features/users/actions/get-roles-by-org.action";
import { getTeamsAction } from "@/features/teams/actions/get-teams.action";
import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";
import { getTranslations } from "next-intl/server";

export default async function CreateEmployeePage() {
  await requireAdminPersona();
  const t = await getTranslations("EmployeeOnboarding");

  const orgRes = await getActiveOrganizationAction();
  const org = orgRes.success ? orgRes.data : null;
  const orgCountry = org?.country ?? null;

  const [rolesRes, teamsRes] = await Promise.all([
    org?.id ? getRolesByOrgAction(org.id) : Promise.resolve({ success: false as const }),
    getTeamsAction(),
  ]);

  const roleOptions =
    "data" in rolesRes && rolesRes.success
      ? rolesRes.data.map((r) => ({
          value: r.id,
          label: r.name ?? r.systemCode ?? r.id,
          description: r.systemCode ?? undefined,
        }))
      : [];

  const teamOptions = teamsRes.success
    ? teamsRes.data.map((tm) => ({ value: tm.id, label: tm.name }))
    : [];

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
      />
    </div>
  );
}
