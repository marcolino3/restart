import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getOrgMembershipsAction } from "@/features/projects/actions/get-org-memberships.action";
import { getProjectsAction } from "@/features/projects/actions/get-projects.action";
import { getProtocolAction } from "@/features/projects/actions/get-protocol.action";
import { ProtocolEditor } from "@/features/projects/components/ProtocolEditor";

interface Props {
  params: Promise<{ protocolId: string }>;
}

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

const ProtocolEditorPage = async ({ params }: Props) => {
  const { protocolId } = await params;
  const t = await getTranslations("Protocols");

  const user = await getCurrentUserAction();
  if (!user?.success) {
    return <div className="p-4 text-sm text-destructive">{t("loadError")}</div>;
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const orgId = user.data.orgId;

  const [protocolResult, membershipsResult, projectsResult] = await Promise.all([
    getProtocolAction(protocolId),
    orgId
      ? getOrgMembershipsAction(orgId)
      : Promise.resolve({ success: true as const, data: [] }),
    getProjectsAction(),
  ]);

  if (!protocolResult.success) {
    return <div className="p-4 text-sm text-destructive">{t("notFound")}</div>;
  }

  const memberships = (
    membershipsResult.success ? membershipsResult.data : []
  ).filter((m) => isSuperAdmin || !m.user?.isSuperAdmin);

  return (
    <ProtocolEditor
      protocol={protocolResult.data}
      orgMemberships={memberships}
      projects={projectsResult.success ? projectsResult.data : []}
      canWrite={has(user.data.permissions ?? [], "PROTOCOL_WRITE", isSuperAdmin)}
    />
  );
};

export default ProtocolEditorPage;
