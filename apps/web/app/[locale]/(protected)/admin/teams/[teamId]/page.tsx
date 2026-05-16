import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getTeamByIdAction } from "@/features/teams/actions/get-team-by-id.action";
import { getTeamMembersAction } from "@/features/teams/actions/get-team-members.action";
import { getEmployeesAction } from "@/features/employees/actions/get-employees.action";
import { TeamDetailView } from "@/features/teams/components/TeamDetailView";

interface Props {
  params: Promise<{ teamId: string }>;
}

const TeamDetailPage = async ({ params }: Props) => {
  const { teamId } = await params;
  const t = await getTranslations("Teams");
  const locale = await getLocale();

  const [teamRes, membersRes, employeesRes] = await Promise.all([
    getTeamByIdAction(teamId),
    getTeamMembersAction(teamId),
    getEmployeesAction(),
  ]);

  if (!teamRes.success || !teamRes.data) {
    notFound();
  }

  const members = membersRes.success ? (membersRes.data ?? []) : [];
  const employees = employeesRes.success ? (employeesRes.data ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.admin.teams(locale)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("backToTeams")}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{teamRes.data.name}</h1>
      </div>
      <TeamDetailView
        team={teamRes.data}
        initialMembers={members}
        employees={employees}
      />
    </div>
  );
};

export default TeamDetailPage;
