import { getTranslations } from "next-intl/server";
import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";
import { getTimeTrackingSettingsAction } from "@/features/time-tracking/actions/settings.action";
import { TimeTrackingSettings } from "@/features/time-tracking/components/TimeTrackingSettings";

const TimeTrackingSettingsPage = async () => {
  await requireAdminPersona();
  const t = await getTranslations("TimeTracking");
  const { holidays, companyVacations } = await getTimeTrackingSettingsAction();

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("settings")}</h1>
      <TimeTrackingSettings
        holidays={holidays}
        companyVacations={companyVacations}
      />
    </div>
  );
};

export default TimeTrackingSettingsPage;
