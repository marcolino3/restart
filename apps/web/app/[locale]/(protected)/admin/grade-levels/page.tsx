import { getLocale, getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getGradeLevelsAction } from "@/features/grade-levels/actions/get-grade-levels.action";
import { getCurriculumLevelsByOrgAction } from "@/features/curricula/actions/get-curriculum-levels-by-org.action";
import {
  pickTranslation,
  type CurriculumLocale,
} from "@/features/curricula/types";
import { GradeLevelsTable } from "@/features/grade-levels/components/GradeLevelsTable";

const GradeLevelsPage = async () => {
  const t = await getTranslations("GradeLevels");
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const locale = await getLocale();
  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  const [gradeLevelsResult, cyclesResult] = await Promise.all([
    getGradeLevelsAction(),
    getCurriculumLevelsByOrgAction(),
  ]);

  const gradeLevels = gradeLevelsResult.success
    ? (gradeLevelsResult.data ?? [])
    : [];

  // Cycles are optional context for the form — a failed load must not stop the
  // page from rendering, the stage list itself works without them.
  const curriculumLevels = (
    cyclesResult.success ? (cyclesResult.data ?? []) : []
  )
    .filter((c) => !c.isArchived)
    .map((c) => ({
      id: c.id,
      name: pickTranslation(c.translations, localeUpper)?.name ?? c.slug,
    }));

  return (
    <GradeLevelsTable
      initialGradeLevels={gradeLevels}
      curriculumLevels={curriculumLevels}
    />
  );
};

export default GradeLevelsPage;
