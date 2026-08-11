"use server";

import { graphql } from "@restart/shared-types";
import { GetOrganizationOwnerQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const GetOrganizationOwnerDocument = graphql(`
  query GetOrganizationOwner($organizationId: String!) {
    organizationOwner(organizationId: $organizationId) {
      userId
      firstName
      lastName
      email
    }
  }
`);

export async function getOrganizationOwnerAction(organizationId: string) {
  const client = await serverCookieGqlClient();

  try {
    const { organizationOwner } =
      await client.request<GetOrganizationOwnerQuery>(
        GetOrganizationOwnerDocument,
        { organizationId }
      );

    return { success: true as const, data: organizationOwner };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
