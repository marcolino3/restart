import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getProjectsAction } from "@/features/projects/actions/get-projects.action";
import { getProtocolTemplatesAction } from "@/features/projects/actions/get-protocol-templates.action";
import { getProtocolsAction } from "@/features/projects/actions/get-protocols.action";
import { ProtocolsList } from "@/features/projects/components/ProtocolsList";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

const ProtocolsPage = async () => {
  const t = await getTranslations("Protocols");
  const [user, protocolsResult, projectsResult, templatesResult] =
    await Promise.all([
      getCurrentUserAction(),
      getProtocolsAction(),
      getProjectsAction(),
      getProtocolTemplatesAction(),
    ]);

  if (!user?.success || !protocolsResult.success) {
    return <div className="p-4 text-sm text-destructive">{t("loadError")}</div>;
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const permissions = user.data.permissions ?? [];

  return (
    <ProtocolsList
      protocols={protocolsResult.data}
      projects={projectsResult.success ? projectsResult.data : []}
      templates={templatesResult.success ? templatesResult.data : []}
      canWrite={has(permissions, "PROTOCOL_WRITE", isSuperAdmin)}
      canDelete={has(permissions, "PROTOCOL_DELETE", isSuperAdmin)}
      canManage={has(permissions, "PROTOCOL_WRITE", isSuperAdmin)}
    />
  );
};

export default ProtocolsPage;
