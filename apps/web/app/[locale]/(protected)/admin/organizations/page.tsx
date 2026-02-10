import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getOrganizationsAction } from "@/features/organizations/actions/get-organizations.action";
import { OrganizationsTable } from "@/features/organizations/components/OrganizationsTable";
import { createOrganizationAction } from "@/features/organizations/actions/create-organization.action";

const OrganizationsPage = async () => {
  const response = await getOrganizationsAction();

  if (!response.success) {
    return <div>Fehler: {response.error}</div>;
  }

  const organizations = response.data;

  return (
    <div>
      <form action={createOrganizationAction}>
        <Button type="submit">
          <PlusIcon />
          Erstellen
        </Button>
      </form>
      <OrganizationsTable data={organizations} />
    </div>
  );
};

export default OrganizationsPage;
