import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getTemplatesAction } from "@/features/projects/actions/get-templates.action";
import { TemplatesList } from "@/features/projects/components/TemplatesList";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

const ProjectTemplatesPage = async () => {
  const t = await getTranslations("Projects");
  const [user, result] = await Promise.all([
    getCurrentUserAction(),
    getTemplatesAction(),
  ]);

  if (!user?.success || !result.success) {
    return <div className="p-4 text-sm text-destructive">{t("loadError")}</div>;
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const canManage = has(
    user.data.permissions ?? [],
    "PROJECT_TEMPLATE_MANAGE",
    isSuperAdmin
  );

  return <TemplatesList templates={result.data} canManage={canManage} />;
};

export default ProjectTemplatesPage;
