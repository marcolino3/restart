"use server";

import { graphql } from "@/gql";
import { GetOrganizationsQuery } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/actions/execute-graphql";

const GetOrganizationsDocument = graphql(`
  query GetOrganizations {
    organizations {
      id
      name
      isActive
    }
  }
`);

export async function getOrganizationsAction() {
  return executeGraphQL<GetOrganizationsQuery["organizations"]>(
    async (client) => {
      const { organizations } = await client.request(GetOrganizationsDocument);
      console.log(organizations);
      return organizations;
    }
  );
}
