import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
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
  const res = await getEmployeeAbsenceCategoryAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const item = res.data;
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href={ROUTES.admin.absenceCategories(locale)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("backToList")}
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold">
          {t("editTitle", { name: pickAbsenceCategoryName(item, locale) })}
        </h1>
      </div>
      <AbsenceCategoryForm mode="edit" initial={item} />
    </div>
  );
};

export default EditAbsenceCategoryPage;
