import { notFound } from "next/navigation";
import { getOrganizationByIdAction } from "@/features/organizations/actions/get-organization-by-id.action";
import { OrganizationForm } from "@/features/organizations/components/OrganizationForm";

interface Props {
  params: Promise<{ organizationId: string }>;
}

const EditOrganizationPage = async ({ params }: Props) => {
  const { organizationId } = await params;
  const response = await getOrganizationByIdAction(organizationId);

  if (!response.success) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Organisation bearbeiten</h1>
      <OrganizationForm organization={response.data} />
    </div>
  );
};

export default EditOrganizationPage;
