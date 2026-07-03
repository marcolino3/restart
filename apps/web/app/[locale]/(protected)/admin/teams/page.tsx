import { getTranslations } from "next-intl/server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getTeamsAction } from "@/features/teams/actions/get-teams.action";
import { getAllTeamMembersAction } from "@/features/teams/actions/get-all-team-members.action";
import { getEmployeesAction } from "@/features/employees/actions/get-employees.action";
import { TeamsBoard } from "@/features/teams/components/TeamsBoard";

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

  const [teamsResult, membersResult, employeesResult] = await Promise.all([
    getTeamsAction(),
    getAllTeamMembersAction(),
    getEmployeesAction(),
  ]);

  const teams = teamsResult.success ? (teamsResult.data ?? []) : [];
  const members = membersResult.success ? (membersResult.data ?? []) : [];
  const employees = employeesResult.success
    ? (employeesResult.data ?? [])
    : [];

  return (
    <TeamsBoard
      initialTeams={teams}
      initialMembers={members}
      employees={employees}
    />
  );
};

export default TeamsPage;
