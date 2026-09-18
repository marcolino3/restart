import { getTranslations } from "next-intl/server";
import { PageHead } from "@/components/common/PageHead";
import {
  getShiftCoverageAction,
  getShiftPlansAction,
  getShiftPlanTeamsAction,
} from "@/features/time-tracking/actions/shift-plans.action";
import { getTeamShiftsAction } from "@/features/time-tracking/actions/shifts.action";
import { ShiftPlansOverview } from "@/features/time-tracking/components/shift-plans/ShiftPlansOverview";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

type Props = { searchParams: Promise<{ team?: string }> };

const ShiftPlansPage = async ({ searchParams }: Props) => {
  const t = await getTranslations("TimeTracking");
  const { team } = await searchParams;

  const [userRes, teamsRes] = await Promise.all([
    getCurrentUserAction(),
    getShiftPlanTeamsAction(),
  ]);
  const user = userRes?.data;
  const permissions = user?.permissions ?? [];
  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  if (!isSuperAdmin && !permissions.includes("SHIFT_PLAN_READ")) {
    return (
      <p className="p-4 text-muted-foreground">{t("noShiftPlanAccess")}</p>
    );
  }

  const teams = teamsRes.success ? teamsRes.data : [];
  const selected = teams.find((x) => x.id === team) ?? teams[0] ?? null;

  const [shiftsRes, coverageRes, plansRes] = selected
    ? await Promise.all([
        getTeamShiftsAction(selected.id),
        getShiftCoverageAction(selected.id),
        getShiftPlansAction(selected.id),
      ])
    : [null, null, null];

  return (
    <div className="space-y-6 p-4">
      <PageHead title={t("shiftPlans")} subtitle={t("shiftPlansSubtitle")} />
      <ShiftPlansOverview
        teams={teams}
        selectedTeamId={selected?.id ?? null}
        shifts={shiftsRes?.success ? shiftsRes.data : []}
        coverage={coverageRes?.success ? coverageRes.data : []}
        plans={plansRes?.success ? plansRes.data : []}
        canManageCoverage={isSuperAdmin || permissions.includes("SHIFT_MANAGE")}
      />
    </div>
  );
};

export default ShiftPlansPage;
