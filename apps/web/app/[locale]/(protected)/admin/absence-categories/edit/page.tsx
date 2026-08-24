import { getTranslations } from "next-intl/server";

import { AbsenceCategoryForm } from "@/features/employee-absence-categories/components/AbsenceCategoryForm";

const CreateAbsenceCategoryPage = async () => {
  const t = await getTranslations("AbsenceCategories");
  return (
    <div className="p-4">
      <AbsenceCategoryForm mode="create" title={t("createTitle")} />
    </div>
  );
};

export default CreateAbsenceCategoryPage;
