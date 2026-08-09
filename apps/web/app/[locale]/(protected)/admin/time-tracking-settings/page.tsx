import { getTranslations } from "next-intl/server";
import { PageHead } from "@/components/common/PageHead";
import { requireAdminRole } from "@/features/users/guards/require-admin-role";
import { getEmployeeAbsenceCategoriesAction } from "@/features/employee-absence-categories/actions/get-employee-absence-categories.action";
import { getTimeTrackingSettingsAction } from "@/features/time-tracking/actions/settings.action";
import {
  getTimeTrackingPeriodAnchorAction,
  getTimeTrackingPeriodsAction,
} from "@/features/time-tracking/actions/periods.action";
import { getEmployeesAction } from "@/features/employees/actions/get-employees.action";
import { AbsenceCategoriesTable } from "@/features/employee-absence-categories/components/AbsenceCategoriesTable";
import {
  CompanyVacationsSection,
  HolidaysSection,
} from "@/features/time-tracking/components/TimeTrackingSettings";
import { PeriodsSection } from "@/features/time-tracking/components/PeriodsSection";
import { PeriodAnchorSection } from "@/features/time-tracking/components/PeriodAnchorSection";
import { PaidOvertimeSection } from "@/features/time-tracking/components/PaidOvertimeSection";
import { OpeningBalancesSection } from "@/features/time-tracking/components/OpeningBalancesSection";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { EmployeeOption } from "@/features/time-tracking/types";

const TimeTrackingSettingsPage = async () => {
  await requireAdminRole();
  const t = await getTranslations("TimeTracking");

  const [
    { holidays, companyVacations },
    periods,
    periodAnchor,
    employeesRes,
    absenceCategoriesRes,
  ] = await Promise.all([
    getTimeTrackingSettingsAction(),
    getTimeTrackingPeriodsAction(),
    getTimeTrackingPeriodAnchorAction(),
    getEmployeesAction(),
    getEmployeeAbsenceCategoriesAction(),
  ]);

  const employees: EmployeeOption[] = (
    "data" in employeesRes ? (employeesRes.data ?? []) : []
  )
    .filter((e) => e.membership.employee?.isActive && e.membership.user)
    .map((e) => ({
      id: e.membership.employee!.id,
      name: `${e.membership.user!.firstName} ${e.membership.user!.lastName}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 p-4">
      <PageHead title={t("settings")} />
      <Tabs defaultValue="holidays">
        <TabsList>
          <TabsTrigger value="holidays">{t("holidays")}</TabsTrigger>
          <TabsTrigger value="companyVacations">
            {t("companyVacations")}
          </TabsTrigger>
          <TabsTrigger value="absenceCategories">
            {t("absenceCategories")}
          </TabsTrigger>
          <TabsTrigger value="periods">{t("periods")}</TabsTrigger>
          <TabsTrigger value="paidOvertime">{t("paidOvertime")}</TabsTrigger>
          <TabsTrigger value="openingBalances">
            {t("openingBalances")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="holidays" className="mt-6">
          <HolidaysSection holidays={holidays} />
        </TabsContent>
        <TabsContent value="companyVacations" className="mt-6">
          <CompanyVacationsSection companyVacations={companyVacations} />
        </TabsContent>
        <TabsContent value="absenceCategories" className="mt-6">
          <AbsenceCategoriesTable
            initialItems={
              absenceCategoriesRes.success
                ? (absenceCategoriesRes.data ?? [])
                : []
            }
          />
        </TabsContent>
        <TabsContent value="periods" className="mt-6 space-y-8">
          <PeriodAnchorSection anchor={periodAnchor} />
          <PeriodsSection periods={periods} />
        </TabsContent>
        <TabsContent value="paidOvertime" className="mt-6">
          <PaidOvertimeSection employees={employees} />
        </TabsContent>
        <TabsContent value="openingBalances" className="mt-6">
          <OpeningBalancesSection employees={employees} periods={periods} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeTrackingSettingsPage;
