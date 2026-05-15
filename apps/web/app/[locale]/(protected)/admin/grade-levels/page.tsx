import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getGradeLevelsAction } from "@/features/grade-levels/actions/get-grade-levels.action";
import { getSchoolClassesAction } from "@/features/school-classes/actions/get-school-classes.action";
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

  const [gradeLevelsResult, classesResult] = await Promise.all([
    getGradeLevelsAction(),
    getSchoolClassesAction(),
  ]);

  const gradeLevels = gradeLevelsResult.success
    ? (gradeLevelsResult.data ?? [])
    : [];

  const classes =
    classesResult.success && classesResult.data ? classesResult.data : [];

  const usedGradeLevelIds = Array.from(
    new Set(classes.flatMap((c) => c.gradeLevels?.map((gl) => gl.id) ?? [])),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("gradeLevels")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("manageGradeLevelsDescription")}
        </p>
      </div>
      <GradeLevelsTable
        initialGradeLevels={gradeLevels}
        usedGradeLevelIds={usedGradeLevelIds}
      />
    </div>
  );
};

export default GradeLevelsPage;
