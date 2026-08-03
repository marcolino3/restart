import { getTranslations } from "next-intl/server";

import { PageHead } from "@/components/common/PageHead";
import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getEmployeeFunctionsAction } from "@/features/employee-functions/actions/get-employee-functions.action";
import { EmployeeFunctionsTable } from "@/features/employee-functions/components/EmployeeFunctionsTable";

const EmployeeFunctionsPage = async () => {
  await requireAdminPersona();
  const t = await getTranslations("EmployeeFunctions");
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const res = await getEmployeeFunctionsAction();

  return (
    <div className="p-4">
      <PageHead title={t("pageTitle")} subtitle={t("pageSubtitle")} stacked />

      {!res.success ? (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {t("loadError")}
        </div>
      ) : (
        <EmployeeFunctionsTable initialItems={res.data ?? []} />
      )}
    </div>
  );
};

export default EmployeeFunctionsPage;
