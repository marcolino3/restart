import { getTranslations } from "next-intl/server";

import { getSickLeaveSettingsAction } from "@/features/employee-absences/actions/sick-leave-settings.actions";
import { SickLeaveSettingsForm } from "@/features/employee-absences/components/SickLeaveSettingsForm";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

export default async function SickLeaveSettingsRoute() {
  const t = await getTranslations("SickLeave");
  const user = await getCurrentUserAction();

  if (!user?.success) {
    return (
      <div className="p-6 text-sm text-destructive">{t("notAuthenticated")}</div>
    );
  }

  const orgId = user.data.orgId;
  if (!orgId) {
    return <div className="p-6 text-sm text-destructive">{t("noOrg")}</div>;
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const roles = user.data.roles ?? [];
  const canManage =
    isSuperAdmin || roles.includes("ORG_OWNER") || roles.includes("ORG_ADMIN");

  const settings = await getSickLeaveSettingsAction(orgId);
  if (!settings.success) {
    return (
      <div className="p-6 text-sm text-destructive">
        {settings.error ?? t("loadError")}
      </div>
    );
  }

  return (
    <SickLeaveSettingsForm
      organizationId={orgId}
      initial={settings.data}
      canManage={canManage}
    />
  );
}
