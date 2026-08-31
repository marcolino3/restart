import { getTranslations } from "next-intl/server";
import { PlusIcon } from "lucide-react";

import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { PageHead } from "@/components/common/PageHead";
import { getMyEmployeeAbsencesAction } from "@/features/employee-absences/actions/employee-absences.actions";
import { getEmployeeAbsenceCategoriesByOrgIdAction } from "@/features/employee-absences/actions/get-employee-absence-categories-by-org-id.action";
import { EmployeeAbsenceNoticeForm } from "@/features/employee-absences/components/EmployeeAbsenceNoticeForm";
import EmployeeAbsencesTab from "@/features/employee-absences/components/EmployeeAbsencesTab";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

/**
 * Self-service absence overview. Deliberately not gated on the time-tracking
 * feature: employees without time tracking still have to report absences and see
 * their own absences.
 */
const MyAbsencesPage = async () => {
  const t = await getTranslations("Common");
  const tE = await getTranslations("Employees");
  const userRes = await getCurrentUserAction();

  // Own absences are org-scoped as well — without an active org there is
  // nothing to show, so ask for an organization instead of an empty table.
  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{tE("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const [absencesRes, categoriesRes] = await Promise.all([
    getMyEmployeeAbsencesAction(),
    getEmployeeAbsenceCategoriesByOrgIdAction(),
  ]);
  const absences = absencesRes.data;

  return (
    <div className="space-y-6 p-4">
      <PageHead
        title={t("myAbsences")}
        subtitle={t("myAbsencesDescription")}
        action={
          <div className="flex flex-wrap items-center gap-2">            {categoriesRes.data ? (
              <OpenSheetButton
                buttonLabel="createAbsenceNotice"
                icon={<PlusIcon />}
                title="createAbsenceNotice"
                description="createAbsenceNoticeDescription"
              >
                <EmployeeAbsenceNoticeForm
                  absenceCategories={categoriesRes.data}
                />
              </OpenSheetButton>
            ) : null}
          </div>
        }
      />

      <EmployeeAbsencesTab
        employeeId={absences[0]?.employeeId ?? ""}
        absences={absences}
        showHeading={false}
        allowWithdraw
      />
    </div>
  );
};

export default MyAbsencesPage;
