import { notFound } from "next/navigation";
import { getOrganizationByIdAction } from "@/features/organizations/actions/get-organization-by-id.action";
import { getOrganizationFeatureTogglesAction } from "@/features/organizations/actions/get-organization-feature-toggles.action";
import { getOrganizationUsageAction } from "@/features/organizations/actions/get-organization-usage.action";
import { OrganizationForm } from "@/features/organizations/components/OrganizationForm";

interface Props {
  params: Promise<{ organizationId: string }>;
}

const EditOrganizationPage = async ({ params }: Props) => {
  const { organizationId } = await params;
  const [response, togglesResponse, usageResponse] = await Promise.all([
    getOrganizationByIdAction(organizationId),
    getOrganizationFeatureTogglesAction(organizationId),
    getOrganizationUsageAction(organizationId),
  ]);

  if (!response.success) {
    notFound();
  }

  return (
    <OrganizationForm
      organization={response.data}
      featureToggles={togglesResponse.success ? togglesResponse.data : []}
      usage={usageResponse.success ? usageResponse.data : null}
    />
  );
};

export default EditOrganizationPage;
