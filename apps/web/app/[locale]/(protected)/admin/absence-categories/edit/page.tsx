import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { AbsenceCategoryForm } from "@/features/employee-absence-categories/components/AbsenceCategoryForm";

const CreateAbsenceCategoryPage = async () => {
  const t = await getTranslations("AbsenceCategories");
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href={ROUTES.admin.absenceCategories(locale)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("backToList")}
        </Link>
      </Button>
      <h1 className="text-2xl font-bold">{t("createTitle")}</h1>
      <AbsenceCategoryForm mode="create" />
    </div>
  );
};

export default CreateAbsenceCategoryPage;
