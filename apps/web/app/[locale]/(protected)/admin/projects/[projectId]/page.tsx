import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getOrgMembershipsAction } from "@/features/projects/actions/get-org-memberships.action";
import { getProjectAction } from "@/features/projects/actions/get-project.action";
import { getProjectTasksAction } from "@/features/projects/actions/get-project-tasks.action";
import { ProjectBoard } from "@/features/projects/components/ProjectBoard";

interface Props {
  params: Promise<{ projectId: string }>;
}

const ProjectBoardPage = async ({ params }: Props) => {
  const { projectId } = await params;
  const t = await getTranslations("Projects");

  const user = await getCurrentUserAction();
  if (!user?.success) {
    return <div className="p-4 text-sm text-destructive">{t("loadError")}</div>;
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const permissions = user.data.permissions ?? [];
  const orgId = user.data.orgId;

  const [projectResult, tasksResult, membershipsResult] = await Promise.all([
    getProjectAction(projectId),
    getProjectTasksAction(projectId),
    orgId
      ? getOrgMembershipsAction(orgId)
      : Promise.resolve({ success: true as const, data: [] }),
  ]);

  if (!projectResult.success || !tasksResult.success) {
    // Non-members get NotFound from the API → render a neutral not-found.
    return <div className="p-4 text-sm text-destructive">{t("notFound")}</div>;
  }

  const project = projectResult.data;
  const canManageAll =
    isSuperAdmin || permissions.includes("PROJECT_MANAGE_ALL");
  const myMember = project.members.find(
    (m) => m.membership?.userId === user.data.id
  );
  const canManage = canManageAll || myMember?.role === "OWNER";
  const canEdit = canManageAll || !!myMember;

  // A platform SuperAdmin is only offered as a selectable member to other
  // SuperAdmins; regular users never see them in the member picker.
  const memberships = (
    membershipsResult.success ? membershipsResult.data : []
  ).filter((m) => isSuperAdmin || !m.user?.isSuperAdmin);

  return (
    <ProjectBoard
      project={project}
      initialTasks={tasksResult.data}
      orgMemberships={memberships}
      canEdit={canEdit}
      canManage={canManage}
    />
  );
};

export default ProjectBoardPage;
