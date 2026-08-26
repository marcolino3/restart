import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import { getEmployeeAbsenceCategoryAction } from "@/features/employee-absence-categories/actions/get-employee-absence-category.action";
import { AbsenceCategoryForm } from "@/features/employee-absence-categories/components/AbsenceCategoryForm";
import { pickAbsenceCategoryName } from "@/features/employee-absence-categories/types";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

const EditAbsenceCategoryPage = async ({ params }: Props) => {
  const { id } = await params;
  const t = await getTranslations("AbsenceCategories");
  const locale = await getLocale();
  const [res, orgRes] = await Promise.all([
    getEmployeeAbsenceCategoryAction(id),
    getActiveOrganizationAction(),
  ]);

  if (!res.success || !res.data) {
    notFound();
  }

  const item = res.data;
  return (
    <div className="p-4">
      <AbsenceCategoryForm
        mode="edit"
        initial={item}
        orgCountry={orgRes.success ? (orgRes.data?.country ?? null) : null}
        title={t("editTitle", { name: pickAbsenceCategoryName(item, locale) })}
      />
    </div>
  );
};

export default EditAbsenceCategoryPage;
