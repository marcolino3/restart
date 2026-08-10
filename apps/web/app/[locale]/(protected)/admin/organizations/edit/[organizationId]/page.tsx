import { notFound } from "next/navigation";
import { getOrganizationByIdAction } from "@/features/organizations/actions/get-organization-by-id.action";
import { getOrganizationFeatureTogglesAction } from "@/features/organizations/actions/get-organization-feature-toggles.action";
import { OrganizationForm } from "@/features/organizations/components/OrganizationForm";

interface Props {
  params: Promise<{ organizationId: string }>;
}

const EditOrganizationPage = async ({ params }: Props) => {
  const { organizationId } = await params;
  const [response, togglesResponse] = await Promise.all([
    getOrganizationByIdAction(organizationId),
    getOrganizationFeatureTogglesAction(organizationId),
  ]);

  if (!response.success) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Organisation bearbeiten</h1>
      <OrganizationForm
        organization={response.data}
        featureToggles={togglesResponse.success ? togglesResponse.data : []}
      />
    </div>
  );
};

export default EditOrganizationPage;
