import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getOrganizationByIdAction } from "@/features/organizations/actions/get-organization-by-id.action";
import { getOrganizationFeatureTogglesAction } from "@/features/organizations/actions/get-organization-feature-toggles.action";
import { getOrganizationUsageAction } from "@/features/organizations/actions/get-organization-usage.action";
import { OrganizationForm } from "@/features/organizations/components/OrganizationForm";

interface Props {
  params: Promise<{ organizationId: string }>;
}

const EditOrganizationPage = async ({ params }: Props) => {
  const { organizationId } = await params;
  const tO = await getTranslations("Organizations");
  const [response, togglesResponse, usageResponse] = await Promise.all([
    getOrganizationByIdAction(organizationId),
    getOrganizationFeatureTogglesAction(organizationId),
    getOrganizationUsageAction(organizationId),
  ]);

  if (!response.success) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{tO("pageTitle")}</h1>
      <OrganizationForm
        organization={response.data}
        featureToggles={togglesResponse.success ? togglesResponse.data : []}
        usage={usageResponse.success ? usageResponse.data : null}
      />
    </div>
  );
};

export default EditOrganizationPage;
