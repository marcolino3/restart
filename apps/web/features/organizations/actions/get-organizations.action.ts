"use server";

import { graphql } from "@/gql";
import { GetOrganizationsQuery } from "@/gql/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const GetOrganizationsDocument = graphql(`
  query GetOrganizations {
    organizations {
      id
      name
      slug
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
