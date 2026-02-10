"use server";

import { graphql } from "@/gql";
import { IsOrganizationSlugAvailableQuery } from "@/gql/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const IsSlugAvailableDocument = graphql(`
  query IsOrganizationSlugAvailable($slug: String!) {
    isOrganizationSlugAvailable(slug: $slug)
  }
`);

export async function checkSlugAvailableAction(
  slug: string
): Promise<boolean> {
  const client = await serverCookieGqlClient();

  try {
    const { isOrganizationSlugAvailable } =
      await client.request<IsOrganizationSlugAvailableQuery>(
        IsSlugAvailableDocument,
        { slug }
      );
    return isOrganizationSlugAvailable;
  } catch (error) {
    console.error(error);
    return false;
  }
}
