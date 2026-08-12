"use server";

import { graphql } from "@restart/shared-types";
import { BulkUpdateOrganizationFeatureTogglesMutation } from "@restart/shared-types/graphql";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const BulkUpdateOrganizationFeatureTogglesDocument = graphql(`
  mutation BulkUpdateOrganizationFeatureToggles(
    $input: BulkUpdateOrganizationFeatureTogglesInput!
  ) {
    bulkUpdateOrganizationFeatureToggles(input: $input) {
      featureKey
      enabled
    }
  }
`);

interface BulkUpdateOrganizationFeatureTogglesParams {
  organizationId: string;
  updates: { featureKey: string; enabled: boolean }[];
}

export async function bulkUpdateOrganizationFeatureTogglesAction(
  params: BulkUpdateOrganizationFeatureTogglesParams
) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { bulkUpdateOrganizationFeatureToggles } =
      await client.request<BulkUpdateOrganizationFeatureTogglesMutation>(
        BulkUpdateOrganizationFeatureTogglesDocument,
        { input: params }
      );

    revalidatePath(ROUTES.admin.organizations(locale));
    return {
      success: true as const,
      data: bulkUpdateOrganizationFeatureToggles,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
