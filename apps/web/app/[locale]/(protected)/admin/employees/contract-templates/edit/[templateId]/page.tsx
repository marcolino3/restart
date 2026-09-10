import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getContractTemplatesAction } from "@/features/contract-templates/actions/get-contract-templates.action";
import { getContractAiConfiguredAction } from "@/features/contract-templates/actions/contract-ai.action";
import { ContractTemplateEditorPage } from "@/features/contract-templates/components/ContractTemplateEditorPage";

export default async function ContractTemplateEditRoute({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const t = await getTranslations("ContractTemplates");
  const [user, templates, aiConfigured] = await Promise.all([
    getCurrentUserAction(),
    getContractTemplatesAction(),
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

  const template = templates.success
    ? templates.data.find((tpl) => tpl.id === templateId)
    : undefined;

  if (!template) {
    return (
      <div className="p-6 text-sm text-destructive">{t("loadError")}</div>
    );
  }

  return (
    <ContractTemplateEditorPage initial={template} aiConfigured={aiConfigured} />
  );
}
