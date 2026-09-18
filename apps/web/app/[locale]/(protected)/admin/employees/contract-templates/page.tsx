import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getContractTemplatesAction } from "@/features/contract-templates/actions/get-contract-templates.action";
import { ContractTemplatesPage } from "@/features/contract-templates/components/ContractTemplatesPage";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

export default async function ContractTemplatesRoute() {
  const t = await getTranslations("ContractTemplates");
  const [user, templates] = await Promise.all([
    getCurrentUserAction(),
    getContractTemplatesAction(),
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
  const canRead = has(permissions, "EMPLOYEE_READ", isSuperAdmin);
  const canManage = has(permissions, "EMPLOYEE_WRITE", isSuperAdmin);

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
    <ContractTemplatesPage
      initialTemplates={templates.data}
      canManage={canManage}
    />
  );
}
