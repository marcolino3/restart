import EmployeeForm from "@/features/employees/components/EmployeeForm";
import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import { getTranslations } from "next-intl/server";

export default async function CreateEmployeePage() {
  const t = await getTranslations("Employees");
  const orgRes = await getActiveOrganizationAction();
  const orgCountry = orgRes.success ? (orgRes.data?.country ?? null) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("createEmployee")}</h1>
      <EmployeeForm orgCountry={orgCountry} />
    </div>
  );
}
