import { getTranslations } from "next-intl/server";

import { getEmployeeAbsenceCategoriesAction } from "@/features/employee-absence-categories/actions/get-employee-absence-categories.action";
import { AbsenceCategoriesTable } from "@/features/employee-absence-categories/components/AbsenceCategoriesTable";

const AbsenceCategoriesPage = async () => {
  const t = await getTranslations("AbsenceCategories");
  const res = await getEmployeeAbsenceCategoriesAction();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground text-sm">{t("pageSubtitle")}</p>
      </div>

      {!res.success ? (
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          {t("loadError")}
        </div>
      ) : (
        <AbsenceCategoriesTable initialItems={res.data ?? []} />
      )}
    </div>
  );
};

export default AbsenceCategoriesPage;
