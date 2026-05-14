import EmployeeForm from "@/features/employees/components/EmployeeForm";
import { getTranslations } from "next-intl/server";

export default async function CreateEmployeePage() {
  const t = await getTranslations("Employees");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("createEmployee")}</h1>
      <EmployeeForm />
    </div>
  );
}
