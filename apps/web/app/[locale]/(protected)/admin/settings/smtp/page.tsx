import { getTranslations } from "next-intl/server";

import { getSmtpSettingsAction } from "@/features/email-templates/actions/smtp-settings-actions";
import { SmtpSettingsForm } from "@/features/email-templates/components/SmtpSettingsForm";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

export default async function SmtpSettingsRoute() {
  const t = await getTranslations("EmailTemplates");
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

  const settings = await getSmtpSettingsAction(orgId);
  if (!settings.success) {
    return (
      <div className="text-sm text-destructive">
        {settings.error ?? t("loadError")}
      </div>
    );
  }

  return (
    <SmtpSettingsForm
      organizationId={orgId}
      initial={settings.data}
      canManage={canManage}
    />
  );
}
