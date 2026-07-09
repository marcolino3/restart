import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getAdmissionsDataAction } from "@/features/admissions-kanban/actions/get-admissions-data.action";
import { getRejectedApplicationsAction } from "@/features/admissions-kanban/actions/get-rejected-applications.action";
import { getGradeLevelsAction } from "@/features/grade-levels/actions/get-grade-levels.action";
import { getClassesForEnrollmentAction } from "@/features/admissions-kanban/actions/get-school-classes-for-enrollment.action";
import { AdmissionsKanban } from "@/features/admissions-kanban/components/AdmissionsKanban";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

const AdmissionsKanbanPage = async () => {
  const t = await getTranslations("Admissions");
  const [user, data, rejected, gradeLevels, schoolClasses] = await Promise.all([
    getCurrentUserAction(),
    getAdmissionsDataAction(),
    getRejectedApplicationsAction(),
    getGradeLevelsAction(),
    getClassesForEnrollmentAction(),
  ]);

  if (!user?.success) {
    return (
      <div className="text-sm text-destructive">{t("notAuthenticated")}</div>
    );
  }
  if (!data.success) {
    return (
      <div className="text-sm text-destructive">
        {data.error ?? t("loadError")}
      </div>
    );
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const permissions = user.data.permissions ?? [];

  return (
    <div className="px-4 pb-4 pt-2">
      <AdmissionsKanban
        initialStages={data.data.stages}
        initialApplications={data.data.applications}
        initialTableColumns={data.data.boardSettings.tableColumns}
        initialRejectionReasons={data.data.rejectionReasons}
        initialSources={data.data.sources}
        gradeLevels={
          gradeLevels.success
            ? [...gradeLevels.data]
                .filter((g) => g.parentId == null)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((g) => ({
                  id: g.id,
                  name: g.name,
                  shortCode: g.shortCode,
                }))
            : []
        }
        schoolClasses={
          schoolClasses.success
            ? schoolClasses.data.map((c) => ({ id: c.id, name: c.name }))
            : []
        }
        rejectedCount={rejected.success ? rejected.data.length : 0}
        canCreate={has(
          permissions,
          "ADMISSION_APPLICATION_WRITE",
          isSuperAdmin,
        )}
        canMove={has(permissions, "ADMISSION_APPLICATION_MOVE", isSuperAdmin)}
        canEnroll={has(
          permissions,
          "ADMISSION_APPLICATION_ENROLL",
          isSuperAdmin,
        )}
        canWrite={has(permissions, "ADMISSION_APPLICATION_WRITE", isSuperAdmin)}
        canManageStages={has(
          permissions,
          "ADMISSION_STAGE_MANAGE",
          isSuperAdmin,
        )}
      />
    </div>
  );
};

export default AdmissionsKanbanPage;
