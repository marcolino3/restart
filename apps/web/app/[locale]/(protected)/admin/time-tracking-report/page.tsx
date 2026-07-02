import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { canSeeTimeReport } from "@/lib/navigation/nav-visibility";
import { getTeamOverviewAction } from "@/features/time-tracking/actions/get-time-report.action";
import { TeamOverviewTable } from "@/features/time-tracking/components/TeamOverviewTable";

const TimeTrackingReportPage = async () => {
  const t = await getTranslations("TimeTracking");
  const userRes = await getCurrentUserAction();

  if (!canSeeTimeReport(userRes?.data)) {
    return <p className="p-4 text-muted-foreground">{t("noReportAccess")}</p>;
  }

  const { rows } = await getTeamOverviewAction();

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("report")}</h1>
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t("teamOverview")}</h2>
        <TeamOverviewTable rows={rows} />
      </div>
    </div>
  );
};

export default TimeTrackingReportPage;
