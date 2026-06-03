import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getAdmissionsDataAction } from "@/features/admissions-kanban/actions/get-admissions-data.action";
import { AdmissionsKanban } from "@/features/admissions-kanban/components/AdmissionsKanban";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

const AdmissionsKanbanPage = async () => {
  const t = await getTranslations("Admissions");
  const [user, data] = await Promise.all([
    getCurrentUserAction(),
    getAdmissionsDataAction(),
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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
      </div>

      <AdmissionsKanban
        initialStages={data.data.stages}
        initialApplications={data.data.applications}
        initialTableColumns={data.data.boardSettings.tableColumns}
        initialRejectionReasons={data.data.rejectionReasons}
        canCreate={has(permissions, "ADMISSION_APPLICATION_WRITE", isSuperAdmin)}
        canMove={has(permissions, "ADMISSION_APPLICATION_MOVE", isSuperAdmin)}
        canEnroll={has(permissions, "ADMISSION_APPLICATION_ENROLL", isSuperAdmin)}
        canWrite={has(permissions, "ADMISSION_APPLICATION_WRITE", isSuperAdmin)}
        canManageStages={has(permissions, "ADMISSION_STAGE_MANAGE", isSuperAdmin)}
      />
    </div>
  );
};

export default AdmissionsKanbanPage;
