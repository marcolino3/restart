import { getEmployeesAction } from "@/features/employees/actions/get-employees.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { isAdminPersona } from "@/features/users/lib/admin-persona";
import { EmployeesTable } from "@/features/employees/components/EmployeesTable";
import { EmployeesCardGrid } from "@/features/employees/components/EmployeesCardGrid";
import { EmployeesCsvUpload } from "@/features/employees/components/EmployeesCsvUpload";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/common/PageHead";
import { PlusIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

const EmployeesPage = async () => {
  const t = await getTranslations("Employees");
  const tC = await getTranslations("Common");
  const locale = await getLocale();
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const canSeeDetails =
    userRes.data.isSuperAdmin || isAdminPersona(userRes.data.persona);
  const { success, data } = await getEmployeesAction();

  const activeCount = (data ?? []).filter(
    (e) => e.membership.employee?.isActive ?? true,
  ).length;

  return (
    <div>
      <PageHead
        title={t("employees")}
        subtitle={
          data && data.length > 0
            ? tC("activeSubtitle", { count: activeCount })
            : undefined
        }
        action={
          canSeeDetails ? (
            <div className="flex items-center gap-2">
              <EmployeesCsvUpload />
              <Button asChild>
                <Link href={ROUTES.admin.employeesCreate(locale)}>
                  <PlusIcon />
                  {t("newEmployee")}
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      />
      {success && data && data.length > 0 ? (
        canSeeDetails ? (
          <EmployeesTable data={data} />
        ) : (
          <EmployeesCardGrid data={data} />
        )
      ) : (
        <p className="text-muted-foreground">{t("noEmployeesFound")}</p>
      )}
    </div>
  );
};

export default EmployeesPage;
