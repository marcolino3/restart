import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getTeamsAction } from "@/features/teams/actions/get-teams.action";
import { TeamsHierarchyTree } from "@/features/teams/components/TeamsHierarchyTree";

const TeamsPage = async () => {
  const t = await getTranslations("Teams");
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const teamsResult = await getTeamsAction();
  const teams = teamsResult.success ? (teamsResult.data ?? []) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("teams")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("teamsDescription")}
        </p>
      </div>
      <TeamsHierarchyTree initialTeams={teams} />
    </div>
  );
};

export default TeamsPage;
