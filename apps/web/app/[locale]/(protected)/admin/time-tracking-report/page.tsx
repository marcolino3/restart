import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHead } from "@/components/common/PageHead";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { canSeeTimeReport } from "@/lib/navigation/nav-visibility";
import { getTeamOverviewAction } from "@/features/time-tracking/actions/get-time-report.action";
import { TeamOverviewTable } from "@/features/time-tracking/components/TeamOverviewTable";
import { formatSignedDurationMinutes } from "@/features/time-tracking/format";

/** KPI-Element aus dem Design-Handoff (`.kpi`): kleines Label, grosser Wert. */
const Kpi = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex flex-col gap-0.5 border-r pr-6 last:border-r-0 last:pr-0">
    <span className="text-[11.5px] font-medium text-muted-foreground">
      {label}
    </span>
    <span className="text-xl font-bold tracking-[-0.02em] tabular-nums">
      {value}
    </span>
  </div>
);

const TimeTrackingReportPage = async () => {
  const t = await getTranslations("TimeTracking");
  const userRes = await getCurrentUserAction();

  if (!canSeeTimeReport(userRes?.data)) {
    return <p className="p-4 text-muted-foreground">{t("noReportAccess")}</p>;
  }

  const { rows, from } = await getTeamOverviewAction();

  const totalNetMinutes = rows.reduce((acc, r) => acc + r.netBalanceMinutes, 0);
  const totalVacationDays = rows.reduce(
    (acc, r) => acc + r.vacationDaysUsed,
    0
  );
  const year = from.substring(0, 4);

  return (
    <div className="space-y-6 p-4">
      <PageHead
        title={t("report")}
        subtitle={`${year} · ${t("employeesCount", { count: rows.length })}`}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-card border bg-card px-5 py-[15px] shadow-card">
        <Kpi label={t("employeesLabel")} value={rows.length} />
        <Kpi
          label={t("netBalanceTotal")}
          value={
            <span className="font-mono">
              {formatSignedDurationMinutes(totalNetMinutes)}
            </span>
          }
        />
        <Kpi
          label={t("vacationDaysUsedShort")}
          value={<span className="font-mono">{totalVacationDays}</span>}
        />
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t("teamOverview")}</h2>
        <TeamOverviewTable rows={rows} />
      </div>
    </div>
  );
};

export default TimeTrackingReportPage;
