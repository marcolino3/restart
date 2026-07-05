import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getAdmissionsDataAction } from "@/features/admissions-kanban/actions/get-admissions-data.action";
import { getRejectedApplicationsAction } from "@/features/admissions-kanban/actions/get-rejected-applications.action";
import { AdmissionsKanban } from "@/features/admissions-kanban/components/AdmissionsKanban";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

const AdmissionsKanbanPage = async () => {
  const t = await getTranslations("Admissions");
  const [user, data, rejected] = await Promise.all([
    getCurrentUserAction(),
    getAdmissionsDataAction(),
    getRejectedApplicationsAction(),
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
    <div className="p-4">
      <AdmissionsKanban
        initialStages={data.data.stages}
        initialApplications={data.data.applications}
        initialTableColumns={data.data.boardSettings.tableColumns}
        initialRejectionReasons={data.data.rejectionReasons}
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
