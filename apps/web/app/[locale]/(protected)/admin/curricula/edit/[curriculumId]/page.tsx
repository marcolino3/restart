import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getCurriculumByIdAction } from "@/features/curricula/actions/get-curriculum-by-id.action";
import { getCurriculumLevelsAction } from "@/features/curricula/actions/get-curriculum-levels.action";
import { getCurriculumNodesAction } from "@/features/curricula/actions/get-curriculum-nodes.action";
import { CurriculumForm } from "@/features/curricula/components/CurriculumForm";
import { CurriculumLevelTree } from "@/features/curricula/components/CurriculumLevelTree";
import { CurriculumLevelsTable } from "@/features/curricula/components/CurriculumLevelsTable";
import { getLessonsForOrgAction } from "@/features/record-keeping/actions/get-lessons-for-org.action";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  pickTranslation,
  type CurriculumLocale,
  type CurriculumNodeDTO,
} from "@/features/curricula/types";

interface PageProps {
  params: Promise<{ curriculumId: string; locale: string }>;
}

const EditCurriculumPage = async ({ params }: PageProps) => {
  const { curriculumId, locale } = await params;
  const t = await getTranslations("Curricula");
  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  const [curriculumRes, levelsRes, lessonsRes] = await Promise.all([
    getCurriculumByIdAction(curriculumId),
    getCurriculumLevelsAction(curriculumId),
    getLessonsForOrgAction(),
  ]);

  if (!curriculumRes.success || !curriculumRes.data) notFound();
  const curriculum = curriculumRes.data;
  const levels = (levelsRes.success && levelsRes.data ? levelsRes.data : [])
    .filter((l) => !l.isArchived)
    .sort((a, b) => a.position - b.position);
  const allLessons = lessonsRes.success ? lessonsRes.data : [];

  const levelNodes = await Promise.all(
    levels.map(async (l) => {
      const res = await getCurriculumNodesAction(curriculumId, l.id);
      return { levelId: l.id, nodes: res.success && res.data ? res.data : [] };
    }),
  );

  const nodesByLevel = new Map<string, CurriculumNodeDTO[]>(
    levelNodes.map((entry) => [entry.levelId, entry.nodes]),
  );

  const headerName =
    pickTranslation(curriculum.translations, localeUpper)?.name ??
    curriculum.slug;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href={ROUTES.admin.curricula(locale)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("backToCurricula")}
        </Link>
      </Button>
      <h1 className="text-2xl font-bold">{headerName}</h1>

      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="structure">{t("structure")}</TabsTrigger>
          <TabsTrigger value="details">{t("curriculumDetails")}</TabsTrigger>
        </TabsList>

        <TabsContent value="structure">
          {levels.length === 1 ? (
            <CurriculumLevelTree
              curriculumId={curriculumId}
              levelId={levels[0].id}
              initialNodes={nodesByLevel.get(levels[0].id) ?? []}
              allLessons={allLessons}
            />
          ) : (
            <CurriculumLevelsTable
              curriculumId={curriculumId}
              levels={levels}
              initialNodesByLevel={nodesByLevel}
              allLessons={allLessons}
            />
          )}
        </TabsContent>

        <TabsContent value="details">
          <CurriculumForm curriculum={curriculum} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditCurriculumPage;
