import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurriculumByIdAction } from "@/features/curricula/actions/get-curriculum-by-id.action";
import { getCurriculumLevelsAction } from "@/features/curricula/actions/get-curriculum-levels.action";
import { getCurriculumNodesAction } from "@/features/curricula/actions/get-curriculum-nodes.action";
import { CurriculumForm } from "@/features/curricula/components/CurriculumForm";
import { CurriculumLevelTree } from "@/features/curricula/components/CurriculumLevelTree";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pickTranslation, type CurriculumLocale } from "@/features/curricula/types";

interface PageProps {
  params: Promise<{ curriculumId: string; locale: string }>;
}

const EditCurriculumPage = async ({ params }: PageProps) => {
  const { curriculumId, locale } = await params;
  const t = await getTranslations("Curricula");
  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  const [curriculumRes, levelsRes] = await Promise.all([
    getCurriculumByIdAction(curriculumId),
    getCurriculumLevelsAction(),
  ]);

  if (!curriculumRes.success || !curriculumRes.data) notFound();
  const curriculum = curriculumRes.data;
  const levels = (levelsRes.success && levelsRes.data ? levelsRes.data : [])
    .filter((l) => !l.isArchived)
    .sort((a, b) => a.position - b.position);

  const levelNodes = await Promise.all(
    levels.map(async (l) => {
      const res = await getCurriculumNodesAction(curriculumId, l.id);
      return { levelId: l.id, nodes: res.success && res.data ? res.data : [] };
    }),
  );

  const nodesByLevel = new Map(
    levelNodes.map((entry) => [entry.levelId, entry.nodes]),
  );

  const headerName =
    pickTranslation(curriculum.translations, localeUpper)?.name ??
    curriculum.slug;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">{headerName}</h1>
        <p className="text-sm text-muted-foreground">/{curriculum.slug}</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          {t("curriculumDetails")}
        </h2>
        <CurriculumForm curriculum={curriculum} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("structure")}</h2>
        {levels.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
            {t("noLevelsYet")}
          </p>
        ) : (
          <Tabs defaultValue={levels[0].id}>
            <TabsList className="flex-wrap h-auto">
              {levels.map((l) => (
                <TabsTrigger key={l.id} value={l.id}>
                  {pickTranslation(l.translations, localeUpper)?.name ??
                    l.slug}
                </TabsTrigger>
              ))}
            </TabsList>
            {levels.map((l) => (
              <TabsContent key={l.id} value={l.id} className="mt-4">
                <CurriculumLevelTree
                  curriculumId={curriculumId}
                  levelId={l.id}
                  initialNodes={nodesByLevel.get(l.id) ?? []}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </section>
    </div>
  );
};

export default EditCurriculumPage;
