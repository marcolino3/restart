"use server";

import { graphql } from "@/gql";
import { IsOrganizationDomainAvailableQuery } from "@/gql/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const IsDomainAvailableDocument = graphql(`
  query IsOrganizationDomainAvailable($domain: String!) {
    isOrganizationDomainAvailable(domain: $domain)
  }
`);

export async function checkDomainAvailableAction(
  domain: string
): Promise<boolean> {
  const client = await serverCookieGqlClient();

  try {
    const { isOrganizationDomainAvailable } =
      await client.request<IsOrganizationDomainAvailableQuery>(
        IsDomainAvailableDocument,
        { domain }
      );
    return isOrganizationDomainAvailable;
  } catch (error) {
    console.error(error);
    return false;
  }
}
