import { getTranslations } from "next-intl/server";
import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { getEmployeeAbsenceCategoriesByOrgIdAction } from "@/features/employee-absences/actions/get-employee-absence-categories-by-org-id.action";
import { EmployeeAbsenceNoticeForm } from "@/features/employee-absences/components/EmployeeAbsenceNoticeForm";
import { getMyTimeTrackingAction } from "@/features/time-tracking/actions/get-my-time-tracking.action";
import { MyTimeTrackingView } from "@/features/time-tracking/components/MyTimeTrackingView";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { canSeeTimeTracking } from "@/lib/navigation/nav-visibility";
import { PlusIcon } from "lucide-react";

const MyTimeTracking = async () => {
  const t = await getTranslations("TimeTracking");

  // Spiegel der Nav-Sichtbarkeit: ohne aktiviertes Feature auch kein
  // Direktzugriff per URL.
  const userRes = await getCurrentUserAction();
  if (!canSeeTimeTracking(userRes?.data)) {
    return (
      <p className="p-4 text-muted-foreground">{t("timeTrackingNotEnabled")}</p>
    );
  }

  const [data, absenceRes] = await Promise.all([
    getMyTimeTrackingAction(),
    getEmployeeAbsenceCategoriesByOrgIdAction(),
  ]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("myTime")}</h1>
        {absenceRes.success && absenceRes.data && (
          <OpenSheetButton
            buttonLabel="createAbsenceNotice"
            icon={<PlusIcon />}
            title="createAbsenceNotice"
            description="createAbsenceNoticeDescription"
          >
            <EmployeeAbsenceNoticeForm absenceCategories={absenceRes.data} />
          </OpenSheetButton>
        )}
      </div>

      <MyTimeTrackingView data={data} />
    </div>
  );
};

export default MyTimeTracking;
