import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { canSeeTimeReport } from "@/lib/navigation/nav-visibility";
import { getEmployeeReportAction } from "@/features/time-tracking/actions/get-time-report.action";
import { TimeBalanceCards } from "@/features/time-tracking/components/TimeBalanceCards";
import { MonthlyBreakdownTable } from "@/features/time-tracking/components/MonthlyBreakdownTable";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const EmployeeReportPage = async ({ params }: Props) => {
  const { employeeId } = await params;
  const t = await getTranslations("TimeTracking");
  const userRes = await getCurrentUserAction();

  if (!canSeeTimeReport(userRes?.data)) {
    return <p className="p-4 text-muted-foreground">{t("noReportAccess")}</p>;
  }

  // Backend erzwingt zusätzlich das Team-Scoping (Forbidden bei fehlender Sicht).
  const { balance, vacation, monthly } =
    await getEmployeeReportAction(employeeId);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("report")}</h1>
      <TimeBalanceCards balance={balance} vacation={vacation} />
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t("monthlyBreakdown")}</h2>
        <MonthlyBreakdownTable monthly={monthly} />
      </div>
    </div>
  );
};

export default EmployeeReportPage;
