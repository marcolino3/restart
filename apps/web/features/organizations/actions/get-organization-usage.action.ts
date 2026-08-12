"use server";

import { graphql } from "@restart/shared-types";
import { GetOrganizationUsageQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const GetOrganizationUsageDocument = graphql(`
  query GetOrganizationUsage($organizationId: String!) {
    organizationUsage(organizationId: $organizationId) {
      userCount
      childCount
      storageUsedGb
      activeUsersLast30Days
      lastLoginAt
      avgLoginsPerDay
    }
  }
`);

export async function getOrganizationUsageAction(organizationId: string) {
  const client = await serverCookieGqlClient();

  try {
    const { organizationUsage } =
      await client.request<GetOrganizationUsageQuery>(
        GetOrganizationUsageDocument,
        { organizationId }
      );

    return { success: true as const, data: organizationUsage };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
