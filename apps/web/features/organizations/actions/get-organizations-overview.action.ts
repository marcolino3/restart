"use server";

import { graphql } from "@restart/shared-types";
import { GetOrganizationsOverviewQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const GetOrganizationsOverviewDocument = graphql(`
  query GetOrganizationsOverview {
    organizationsOverview {
      stats {
        activeCount
        trialCount
        totalUserCount
        suspendedCount
      }
      rows {
        memberCount
        childCount
        enabledFeatureCount
        trialDaysRemaining
        organization {
          id
          name
          shortCode
          plan
          userLicenseLimit
          lifecycleStatus
          suspendedReason
          createdAt
        }
      }
    }
  }
`);

export async function getOrganizationsOverviewAction() {
  const client = await serverCookieGqlClient();

  try {
    const { organizationsOverview } =
      await client.request<GetOrganizationsOverviewQuery>(
        GetOrganizationsOverviewDocument
      );

    return { success: true as const, data: organizationsOverview };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
