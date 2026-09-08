import { getTranslations } from "next-intl/server";

import { getAiSettingsAction } from "@/features/organization-settings/actions/ai-settings-actions";
import { AiSettingsForm } from "@/features/organization-settings/components/AiSettingsForm";
import { ShiftAiSettingsForm } from "@/features/organization-settings/components/ShiftAiSettingsForm";
import { Separator } from "@/components/ui/separator";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

export default async function AiSettingsRoute() {
  const t = await getTranslations("OrganizationSettings");
  const user = await getCurrentUserAction();

  if (!user?.success) {
    return (
      <div className="text-sm text-destructive">{t("notAuthenticated")}</div>
    );
  }

  const orgId = user.data.orgId;
  if (!orgId) {
    return <div className="text-sm text-destructive">{t("noOrg")}</div>;
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const roles = user.data.roles ?? [];
  const canManage =
    isSuperAdmin || roles.includes("ORG_OWNER") || roles.includes("ORG_ADMIN");

  const settings = await getAiSettingsAction(orgId);
  if (!settings.success) {
    return (
      <div className="text-sm text-destructive">
        {settings.error ?? t("loadError")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AiSettingsForm
        organizationId={orgId}
        initial={settings.data}
        canManage={canManage}
      />
      <Separator className="max-w-xl" />
      <ShiftAiSettingsForm
        organizationId={orgId}
        initial={settings.data.shiftPlanning}
        canManage={canManage}
      />
    </div>
  );
}
