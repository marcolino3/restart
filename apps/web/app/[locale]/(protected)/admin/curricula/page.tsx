import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getCurriculaAction } from "@/features/curricula/actions/get-curricula.action";
import { CurriculaTable } from "@/features/curricula/components/CurriculaTable";
import { CurriculumImportDialog } from "@/features/curricula/components/CurriculumImportDialog";

const CurriculaPage = async () => {
  const t = await getTranslations("Curricula");
  const locale = await getLocale();
  const { success, data } = await getCurriculaAction();
  const list = success && data ? data : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("curricula")}</h1>
        <div className="flex items-center gap-2">
          <CurriculumImportDialog />
          <Button asChild>
            <Link href={ROUTES.admin.curriculaCreate(locale)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {t("createCurriculum")}
            </Link>
          </Button>
        </div>
      </div>
      <CurriculaTable data={list} />
    </div>
  );
};

export default CurriculaPage;
