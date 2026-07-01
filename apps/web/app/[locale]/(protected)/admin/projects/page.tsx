import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getOrgMembershipsAction } from "@/features/projects/actions/get-org-memberships.action";
import { getProjectsAction } from "@/features/projects/actions/get-projects.action";
import { getTemplatesAction } from "@/features/projects/actions/get-templates.action";
import { ProjectsList } from "@/features/projects/components/ProjectsList";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

const ProjectsPage = async () => {
  const t = await getTranslations("Projects");
  const user = await getCurrentUserAction();

  if (!user?.success) {
    return <div className="p-4 text-sm text-destructive">{t("loadError")}</div>;
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const permissions = user.data.permissions ?? [];
  const orgId = user.data.orgId;

  const [projectsResult, membershipsResult, templatesResult] =
    await Promise.all([
      getProjectsAction(),
      orgId
        ? getOrgMembershipsAction(orgId)
        : Promise.resolve({ success: true as const, data: [] }),
      getTemplatesAction(),
    ]);

  if (!projectsResult.success) {
    return <div className="p-4 text-sm text-destructive">{t("loadError")}</div>;
  }

  // A platform SuperAdmin is only offered as a selectable member to other
  // SuperAdmins; regular users never see them in the member picker.
  const memberships = (
    membershipsResult.success ? membershipsResult.data : []
  ).filter((m) => isSuperAdmin || !m.user?.isSuperAdmin);

  return (
    <ProjectsList
      projects={projectsResult.data}
      orgMemberships={memberships}
      templates={templatesResult.success ? templatesResult.data : []}
      canCreate={has(permissions, "PROJECT_CREATE", isSuperAdmin)}
      canManageTemplates={has(
        permissions,
        "PROJECT_TEMPLATE_MANAGE",
        isSuperAdmin
      )}
    />
  );
};

export default ProjectsPage;
