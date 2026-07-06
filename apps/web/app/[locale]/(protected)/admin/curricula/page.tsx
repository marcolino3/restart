import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/common/PageHead";
import { ROUTES } from "@/constants/routes";
import { getCurriculaAction } from "@/features/curricula/actions/get-curricula.action";
import { CurriculaTable } from "@/features/curricula/components/CurriculaTable";
import { CurriculumImportDialog } from "@/features/curricula/components/CurriculumImportDialog";
import { ShowArchivedToggle } from "@/features/curricula/components/ShowArchivedToggle";

interface PageProps {
  searchParams: Promise<{ archived?: string }>;
}

const CurriculaPage = async ({ searchParams }: PageProps) => {
  const t = await getTranslations("Curricula");
  const locale = await getLocale();
  const { archived } = await searchParams;
  const includeArchived = archived === "1";

  const curriculaRes = await getCurriculaAction(includeArchived);
  const list = curriculaRes.success && curriculaRes.data ? curriculaRes.data : [];

  return (
    <div>
      <PageHead
        title={t("curricula")}
        subtitle={t("countSubtitle", { count: list.length })}
        action={
          <div className="flex items-center gap-3">
            <ShowArchivedToggle />
            <CurriculumImportDialog />
            <Button asChild>
              <Link href={ROUTES.admin.curriculaCreate(locale)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                {t("createCurriculum")}
              </Link>
            </Button>
          </div>
        }
      />
      <CurriculaTable data={list} />
    </div>
  );
};

export default CurriculaPage;
