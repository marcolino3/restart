import { getEmployeesAction } from "@/features/employees/actions/get-employees.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { EmployeesTable } from "@/features/employees/components/EmployeesTable";
import { EmployeesCsvUpload } from "@/features/employees/components/EmployeesCsvUpload";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
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

  const { success, data } = await getEmployeesAction();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("employees")}</h1>
        <div className="flex items-center gap-2">
          <EmployeesCsvUpload />
          <Button asChild>
            <Link href={ROUTES.admin.employeesCreate(locale)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {tC("createEmployee")}
            </Link>
          </Button>
        </div>
      </div>
      {success && data && data.length > 0 ? (
        <EmployeesTable data={data} />
      ) : (
        <p className="text-muted-foreground">{t("noEmployeesFound")}</p>
      )}
    </div>
  );
};

export default EmployeesPage;
