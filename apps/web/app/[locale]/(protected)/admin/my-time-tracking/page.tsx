import { getTranslations } from "next-intl/server";
import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { PageHead } from "@/components/common/PageHead";
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
      <PageHead
        title={t("myTime")}
        action={
          absenceRes.success && absenceRes.data ? (
            <OpenSheetButton
              buttonLabel="createAbsenceNotice"
              icon={<PlusIcon />}
              title="createAbsenceNotice"
              description="createAbsenceNoticeDescription"
            >
              <EmployeeAbsenceNoticeForm absenceCategories={absenceRes.data} />
            </OpenSheetButton>
          ) : undefined
        }
      />

      <MyTimeTrackingView data={data} />
    </div>
  );
};

export default MyTimeTracking;
