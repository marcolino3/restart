import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getGradeLevelsAction } from "@/features/grade-levels/actions/get-grade-levels.action";
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

  const gradeLevelsResult = await getGradeLevelsAction();
  const gradeLevels = gradeLevelsResult.success
    ? (gradeLevelsResult.data ?? [])
    : [];

  return <GradeLevelsTable initialGradeLevels={gradeLevels} />;
};

export default GradeLevelsPage;
