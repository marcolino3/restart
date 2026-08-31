import { getTranslations } from "next-intl/server";

import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import { AbsenceCategoryForm } from "@/features/employee-absence-categories/components/AbsenceCategoryForm";

const CreateAbsenceCategoryPage = async () => {
  const t = await getTranslations("AbsenceCategories");
  const orgRes = await getActiveOrganizationAction();
  return (
    <div className="p-4">
      <AbsenceCategoryForm
        mode="create"
        title={t("createTitle")}
        orgCountry={orgRes.success ? (orgRes.data?.country ?? null) : null}
      />
    </div>
  );
};

export default CreateAbsenceCategoryPage;
