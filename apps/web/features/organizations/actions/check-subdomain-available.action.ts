"use server";

import { graphql } from "@restart/shared-types";
import { IsOrganizationSubdomainAvailableQuery } from "@restart/shared-types/graphql";
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
