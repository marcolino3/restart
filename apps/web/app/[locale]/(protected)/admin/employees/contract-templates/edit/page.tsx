import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getContractAiConfiguredAction } from "@/features/contract-templates/actions/contract-ai.action";
import { ContractTemplateEditorPage } from "@/features/contract-templates/components/ContractTemplateEditorPage";

export default async function ContractTemplateCreateRoute() {
  const t = await getTranslations("ContractTemplates");
  const [user, aiConfigured] = await Promise.all([
    getCurrentUserAction(),
    getContractAiConfiguredAction(),
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
  const canManage = isSuperAdmin || permissions.includes("EMPLOYEE_WRITE");

  if (!canManage) {
    return <div className="p-6 text-sm text-destructive">{t("noAccess")}</div>;
  }

  return <ContractTemplateEditorPage aiConfigured={aiConfigured} />;
}
