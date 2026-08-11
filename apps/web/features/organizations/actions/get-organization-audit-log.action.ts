"use server";

import { graphql } from "@restart/shared-types";
import { GetOrganizationAuditLogQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const GetOrganizationAuditLogDocument = graphql(`
  query GetOrganizationAuditLog(
    $organizationId: String!
    $limit: Int
    $offset: Int
  ) {
    organizationAuditLog(
      organizationId: $organizationId
      limit: $limit
      offset: $offset
    ) {
      total
      items {
        id
        action
        createdAt
        actorUser {
          id
          firstName
          lastName
        }
      }
    }
  }
`);

export async function getOrganizationAuditLogAction(
  organizationId: string,
  limit = 25,
  offset = 0
) {
  const client = await serverCookieGqlClient();

  try {
    const { organizationAuditLog } =
      await client.request<GetOrganizationAuditLogQuery>(
        GetOrganizationAuditLogDocument,
        { organizationId, limit, offset }
      );

    return { success: true as const, data: organizationAuditLog };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
