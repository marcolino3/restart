import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { getOrganizationsAction } from "@/features/organizations/actions/get-organzations.action";
import { CreateOrganizationForm } from "@/features/organizations/components/CreateOrganizationForm";
import { OrganizationsTable } from "@/features/organizations/components/OrganizationsTable";
import { PlusIcon } from "lucide-react";

const OrganizationsPage = async () => {
  const response = await getOrganizationsAction();

  if (!response.success) {
    return <div>Fehler: {response.error}</div>;
  }

  const organizations = response.data;

  return (
    <div>
      <OpenSheetButton
        title="createOrganization"
        description="createOrganizationDescription"
        buttonLabel="create"
        icon={<PlusIcon />}
      >
        <CreateOrganizationForm />
      </OpenSheetButton>
      <OrganizationsTable data={organizations} />
    </div>
  );
};

export default OrganizationsPage;
