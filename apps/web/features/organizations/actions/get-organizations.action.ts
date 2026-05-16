"use server";

import { graphql } from "@restart/shared-types";
import { GetOrganizationsQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const GetOrganizationsDocument = graphql(`
  query GetOrganizations {
    organizations {
      id
      name
      subdomain
      domain
      isActive
    }
  }
`);

export async function getOrganizationsAction() {
  const client = await serverCookieGqlClient();

  try {
    const { organizations } =
      await client.request<GetOrganizationsQuery>(GetOrganizationsDocument);
    return { success: true, data: organizations };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
}
