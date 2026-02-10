import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

type OrganizationsResponse = {
  organizations: {
    id: string;
    name: string;
    slug: string;
  }[];
};

const GetOrganizationsDocument = gql`
  query GetOrganizationsForSwitcher {
    organizations {
      id
      name
      slug
    }
  }
`;

export async function getOrganizationsAction() {
  const client = await serverCookieGqlClient();
  try {
    const data: OrganizationsResponse =
      await client.request(GetOrganizationsDocument);
    return { success: true, data: data.organizations };
  } catch {
    return { success: false, data: [] as OrganizationsResponse["organizations"] };
  }
}
