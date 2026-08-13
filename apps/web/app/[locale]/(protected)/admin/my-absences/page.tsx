import { getTranslations } from "next-intl/server";
import { ThermometerIcon } from "lucide-react";

import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { PageHead } from "@/components/common/PageHead";
import { getMyEmployeeAbsencesAction } from "@/features/employee-absences/actions/employee-absences.actions";
import EmployeeAbsencesTab from "@/features/employee-absences/components/EmployeeAbsencesTab";
import { SickLeaveForm } from "@/features/employee-absences/components/SickLeaveForm";

/**
 * Self-service absence overview. Deliberately not gated on the time-tracking
 * feature: employees without time tracking still have to report sick and see
 * their own absences.
 */
const MyAbsencesPage = async () => {
  const t = await getTranslations("Common");
  const absencesRes = await getMyEmployeeAbsencesAction();
  const absences = absencesRes.data;

  return (
    <div className="space-y-6 p-4">
      <PageHead
        title={t("myAbsences")}
        subtitle={t("myAbsencesDescription")}
        action={
          <OpenSheetButton
            buttonLabel="reportSickLeave"
            icon={<ThermometerIcon />}
            title="reportSickLeave"
            description="reportSickLeaveDescription"
          >
            <SickLeaveForm />
          </OpenSheetButton>
        }
      />

      <EmployeeAbsencesTab
        employeeId={absences[0]?.employeeId ?? ""}
        absences={absences}
        showHeading={false}
      />
    </div>
  );
};

export default MyAbsencesPage;
