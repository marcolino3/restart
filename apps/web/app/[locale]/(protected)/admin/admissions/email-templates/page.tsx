import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getEmailTemplatesAction } from "@/features/email-templates/actions/get-email-templates.action";
import { EmailTemplatesPage } from "@/features/email-templates/components/EmailTemplatesPage";
import { AdmissionsSubNav } from "@/features/admissions-kanban/components/AdmissionsSubNav";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

export default async function EmailTemplatesRoute() {
  const t = await getTranslations("EmailTemplates");
  const [user, templates] = await Promise.all([
    getCurrentUserAction(),
    getEmailTemplatesAction("ADMISSION"),
  ]);

  if (!user?.success) {
    return (
      <div className="p-6 text-sm text-destructive">
        {t("notAuthenticated")}
      </div>
    );
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const permissions = user.data.permissions ?? [];
  const canRead = has(permissions, "ADMISSION_APPLICATION_READ", isSuperAdmin);
  const canManage = has(
    permissions,
    "ADMISSION_EMAIL_TEMPLATE_MANAGE",
    isSuperAdmin,
  );

  if (!canRead) {
    return <div className="p-6 text-sm text-destructive">{t("noAccess")}</div>;
  }

  if (!templates.success) {
    return (
      <div className="p-6 text-sm text-destructive">
        {templates.error ?? t("loadError")}
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pt-4">
        <AdmissionsSubNav active="templates" />
      </div>
      <EmailTemplatesPage
        initialTemplates={templates.data}
        canManage={canManage}
      />
    </div>
  );
}
