"use server";

import { graphql } from "@restart/shared-types";
import { OrganizationFeatureTogglesQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const OrganizationFeatureTogglesDocument = graphql(`
  query OrganizationFeatureToggles($organizationId: ID!) {
    organizationFeatureToggles(organizationId: $organizationId) {
      featureKey
      enabled
    }
  }
`);

export async function getOrganizationFeatureTogglesAction(organizationId: string) {
  const client = await serverCookieGqlClient();

  try {
    const { organizationFeatureToggles } =
      await client.request<OrganizationFeatureTogglesQuery>(
        OrganizationFeatureTogglesDocument,
        { organizationId }
      );

    return { success: true as const, data: organizationFeatureToggles };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: String(error) };
  }
}
