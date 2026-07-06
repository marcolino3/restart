import { getTranslations } from "next-intl/server";
import { PageHead } from "@/components/common/PageHead";
import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";
import { getTimeTrackingSettingsAction } from "@/features/time-tracking/actions/settings.action";
import { getTimeTrackingPeriodsAction } from "@/features/time-tracking/actions/periods.action";
import { getEmployeesAction } from "@/features/employees/actions/get-employees.action";
import { TimeTrackingSettings } from "@/features/time-tracking/components/TimeTrackingSettings";
import { PeriodsSection } from "@/features/time-tracking/components/PeriodsSection";
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
  await requireAdminPersona();
  const t = await getTranslations("TimeTracking");

  const [{ holidays, companyVacations }, periods, employeesRes] =
    await Promise.all([
      getTimeTrackingSettingsAction(),
      getTimeTrackingPeriodsAction(),
      getEmployeesAction(),
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
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          <TabsTrigger value="periods">{t("periods")}</TabsTrigger>
          <TabsTrigger value="paidOvertime">{t("paidOvertime")}</TabsTrigger>
          <TabsTrigger value="openingBalances">
            {t("openingBalances")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <TimeTrackingSettings
            holidays={holidays}
            companyVacations={companyVacations}
          />
        </TabsContent>
        <TabsContent value="periods" className="mt-6">
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
