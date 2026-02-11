"use server";

import { graphql } from "@/gql";
import { IsOrganizationSubdomainAvailableQuery } from "@/gql/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const IsSubdomainAvailableDocument = graphql(`
  query IsOrganizationSubdomainAvailable($subdomain: String!) {
    isOrganizationSubdomainAvailable(subdomain: $subdomain)
  }
`);

export async function checkSubdomainAvailableAction(
  subdomain: string
): Promise<boolean> {
  const client = await serverCookieGqlClient();

  try {
    const { isOrganizationSubdomainAvailable } =
      await client.request<IsOrganizationSubdomainAvailableQuery>(
        IsSubdomainAvailableDocument,
        { subdomain }
      );
    return isOrganizationSubdomainAvailable;
  } catch (error) {
    console.error(error);
    return false;
  }
}
