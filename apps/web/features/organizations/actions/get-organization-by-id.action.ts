"use server";

import { graphql } from "@/gql";
import { OrganizationQuery } from "@/gql/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const OrganizationByIdDocument = graphql(`
  query Organization($id: String!) {
    organization(id: $id) {
      id
      name
      slug
      domain
      street
      zip
      city
      country
      phone
      email
      website
      timezone
      isActive
      createdAt
      updatedAt
    }
  }
`);

export async function getOrganizationByIdAction(id: string) {
  const client = await serverCookieGqlClient();

  try {
    const { organization } = await client.request<OrganizationQuery>(
      OrganizationByIdDocument,
      { id }
    );

    return { success: true as const, data: organization };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: String(error) };
  }
}
