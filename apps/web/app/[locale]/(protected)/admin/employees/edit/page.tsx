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
      ? rolesRes.data.map((r) => {
          const nameKey = `roleName_${r.systemCode}`;
          const descKey = `roleDesc_${r.systemCode}`;
          // Prefer a custom role name; otherwise the translated system-role
          // label/description. Falls back to the raw code if untranslated.
          return {
            value: r.id,
            // System roles carry their code as name in the DB — prefer the
            // translated label; custom roles use their own name.
            label:
              r.systemCode && t.has(nameKey)
                ? t(nameKey)
                : (r.name ?? r.systemCode ?? r.id),
            description:
              r.systemCode && t.has(descKey) ? t(descKey) : undefined,
          };
        })
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
