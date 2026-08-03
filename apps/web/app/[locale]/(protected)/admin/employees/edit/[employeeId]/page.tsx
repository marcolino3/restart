import { EmployeeOnboardingWizard } from "@/features/employees/components/wizard/EmployeeOnboardingWizard";
import { getEmployeeByIdAction } from "@/features/employees/actions/get-employee-by-id.action";
import { getEmployeeContractsAction } from "@/features/employees/actions/employee-contracts.actions";
import { getEmployeeFunctionsAction } from "@/features/employee-functions/actions/get-employee-functions.action";
import { mapEmployeeToOnboardingForm } from "@/features/employees/lib/map-employee-to-onboarding-form";
import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import { getRolesByOrgAction } from "@/features/users/actions/get-roles-by-org.action";
import { getTeamsAction } from "@/features/teams/actions/get-teams.action";
import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const EditEmployeePage = async ({ params }: Props) => {
  await requireAdminPersona();
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

  if (!employeeResult.success || !employeeResult.data) {
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

  const org = orgResult.success ? orgResult.data : null;
  const [rolesRes, teamsRes] = await Promise.all([
    org?.id
      ? getRolesByOrgAction(org.id)
      : Promise.resolve({ success: false as const }),
    getTeamsAction(),
  ]);

  const roleOptions =
    "data" in rolesRes && rolesRes.success
      ? rolesRes.data.map((r) => {
          const nameKey = `roleName_${r.systemCode}`;
          const descKey = `roleDesc_${r.systemCode}`;
          return {
            value: r.id,
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
