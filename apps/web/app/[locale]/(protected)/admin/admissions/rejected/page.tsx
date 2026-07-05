import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getRejectedApplicationsAction } from "@/features/admissions-kanban/actions/get-rejected-applications.action";
import { RejectedApplicationsList } from "@/features/admissions-kanban/components/RejectedApplicationsList";
import { AdmissionsSubNav } from "@/features/admissions-kanban/components/AdmissionsSubNav";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

const RejectedApplicationsPage = async () => {
  const t = await getTranslations("Admissions");
  const [user, data] = await Promise.all([
    getCurrentUserAction(),
    getRejectedApplicationsAction(),
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
  if (!has(permissions, "ADMISSION_APPLICATION_READ", isSuperAdmin)) {
    return (
      <div className="p-6 text-sm text-destructive">{t("notAuthorized")}</div>
    );
  }

  if (!data.success) {
    return (
      <div className="p-6 text-sm text-destructive">
        {data.error ?? t("loadError")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">{t("rejectedListTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("rejectedListSubtitle", { count: data.data.length })}
        </p>
      </div>
      <AdmissionsSubNav active="rejected" rejectedCount={data.data.length} />
      <RejectedApplicationsList applications={data.data} />
    </div>
  );
};

export default RejectedApplicationsPage;
