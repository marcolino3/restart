import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { getEmployeeAbsenceCategoriesByOrgIdAction } from "@/features/employee-absences/actions/get-employee-absence-categories-by-org-id.action";
import { EmployeeAbsenceNoticeForm } from "@/features/employee-absences/components/EmployeeAbsenceNoticeForm";
import { PlusIcon } from "lucide-react";

const MyTimeTracking = async () => {
  const { success, data } = await getEmployeeAbsenceCategoriesByOrgIdAction();

  if (!success || !data) {
    return <div>No Data found</div>;
  }
  return (
    <div>
      <OpenSheetButton
        buttonLabel="createAbsenceNotice"
        icon={<PlusIcon />}
        title="createAbsenceNotice"
        description="createAbsenceNoticeDescription"
      >
        <EmployeeAbsenceNoticeForm absenceCategories={data} />
      </OpenSheetButton>
    </div>
  );
};

export default MyTimeTracking;
