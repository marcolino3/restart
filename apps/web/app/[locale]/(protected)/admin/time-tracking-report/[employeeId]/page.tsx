import { getLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { PageHead } from "@/components/common/PageHead";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { canSeeTimeReport } from "@/lib/navigation/nav-visibility";
import { getEmployeeReportAction } from "@/features/time-tracking/actions/get-time-report.action";
import { TimeBalanceCards } from "@/features/time-tracking/components/TimeBalanceCards";
import { MonthlyBreakdownTable } from "@/features/time-tracking/components/MonthlyBreakdownTable";
import { AbsenceCategorySummaryTable } from "@/features/time-tracking/components/AbsenceCategorySummaryTable";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const EmployeeReportPage = async ({ params }: Props) => {
  const { employeeId } = await params;
  const t = await getTranslations("TimeTracking");
  const locale = await getLocale();
  const userRes = await getCurrentUserAction();

  if (!canSeeTimeReport(userRes?.data)) {
    return <p className="p-4 text-muted-foreground">{t("noReportAccess")}</p>;
  }

  // Backend erzwingt zusätzlich das Team-Scoping (Forbidden bei fehlender Sicht).
  const { balance, vacation, monthly, missingRecordDays, categorySummary, from, to } =
    await getEmployeeReportAction(employeeId);

  const pdfHref = `/api/time-tracking/report?employeeId=${encodeURIComponent(
    employeeId
  )}&from=${from}&to=${to}&locale=${locale.toUpperCase()}`;

  return (
    <div className="space-y-6 p-4">
      <PageHead
        title={t("report")}
        action={
          <Button asChild variant="outline">
            <a href={pdfHref} download>
              <Download className="mr-2 size-4" />
              {t("downloadPdf")}
            </a>
          </Button>
        }
      />
      <TimeBalanceCards balance={balance} vacation={vacation} />
      {missingRecordDays.length > 0 ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <h2 className="mb-1 font-semibold text-destructive">
            {t("missingRecords", { count: missingRecordDays.length })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {missingRecordDays
              .map((d) =>
                new Date(`${d}T12:00:00`).toLocaleDateString(
                  locale === "de" ? "de-CH" : "en-GB"
                )
              )
              .join(", ")}
          </p>
        </div>
      ) : null}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          {t("absencesByCategory")}
        </h2>
        <AbsenceCategorySummaryTable categories={categorySummary} />
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t("monthlyBreakdown")}</h2>
        <MonthlyBreakdownTable monthly={monthly} />
      </div>
    </div>
  );
};

export default EmployeeReportPage;
