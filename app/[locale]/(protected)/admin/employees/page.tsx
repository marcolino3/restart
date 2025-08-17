import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { getEmployeesAction } from "@/features/employees/actions/get-employees.action";
import { CreateEmployeeForm } from "@/features/employees/components/CreateEmployeeForm";
import { EmployeesTable } from "@/features/employees/components/EmployeesTable";
import { PlusIcon } from "lucide-react";
import React from "react";

const EmployeesPage = async () => {
  const { success, data } = await getEmployeesAction();

  if (!success || !data) {
    return <div>no employees found</div>;
  }

  return (
    <div>
      <OpenSheetButton
        title="createEmployee"
        description="createEmployeeDescription"
        buttonLabel="createEmployee"
        icon={<PlusIcon />}
      >
        <CreateEmployeeForm />
      </OpenSheetButton>
      <EmployeesTable data={data} />
    </div>
  );
};

export default EmployeesPage;
