"use server";

import { graphql } from "@restart/shared-types";
import { IsOrganizationDomainAvailableQuery } from "@restart/shared-types/graphql";
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
