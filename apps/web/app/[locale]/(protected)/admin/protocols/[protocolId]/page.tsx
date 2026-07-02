import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getOrgMembershipsAction } from "@/features/projects/actions/get-org-memberships.action";
import { getProjectsAction } from "@/features/projects/actions/get-projects.action";
import { getProtocolAction } from "@/features/projects/actions/get-protocol.action";
import { getProtocolTasksAction } from "@/features/projects/actions/get-protocol-tasks.action";
import { ProtocolEditor } from "@/features/projects/components/ProtocolEditor";
import { ProtocolView } from "@/features/projects/components/ProtocolView";

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

  const [protocolResult, membershipsResult, projectsResult, tasksResult] =
    await Promise.all([
      getProtocolAction(protocolId),
      orgId
        ? getOrgMembershipsAction(orgId)
        : Promise.resolve({ success: true as const, data: [] }),
      getProjectsAction(),
      getProtocolTasksAction(protocolId),
    ]);

  if (!protocolResult.success) {
    return <div className="p-4 text-sm text-destructive">{t("notFound")}</div>;
  }

  const memberships = (
    membershipsResult.success ? membershipsResult.data : []
  ).filter((m) => isSuperAdmin || !m.user?.isSuperAdmin);

  const protocol = protocolResult.data;
  const existingTasks = tasksResult.success ? tasksResult.data : [];

  // Edit rights: admins (PROTOCOL_DELETE / SuperAdmin), the creator, or a
  // meeting participant. Everyone else gets the read-only view.
  const permissions = user.data.permissions ?? [];
  const canManageAll = has(permissions, "PROTOCOL_DELETE", isSuperAdmin);
  const myUserId = user.data.id;
  const isCreator = protocol.createdBy?.userId === myUserId;
  const isParticipant = (protocol.participants ?? []).some(
    (p) => p.membership?.userId === myUserId
  );
  const canEdit = canManageAll || isCreator || isParticipant;

  if (!canEdit) {
    return <ProtocolView protocol={protocol} tasks={existingTasks} />;
  }

  return (
    <ProtocolEditor
      protocol={protocol}
      orgMemberships={memberships}
      projects={projectsResult.success ? projectsResult.data : []}
      existingTasks={existingTasks}
      canWrite
    />
  );
};

export default ProtocolEditorPage;
