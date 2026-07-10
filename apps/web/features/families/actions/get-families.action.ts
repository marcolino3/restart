"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

/** A family with just enough for the create-application family search. */
export type FamilyListItem = {
  id: string;
  name: string;
  contactPersons: Array<{ firstName: string; lastName: string }>;
};

type GetFamiliesResponse = {
  families: FamilyListItem[];
};

// Org scoping comes from the session cookie via the backend `families` resolver
// (@CurrentOrgId + FAMILY_READ) — never pass an org id from the client.
const Document = gql`
  query Families {
    families {
      id
      name
      contactPersons {
        firstName
        lastName
      }
    }
  }
`;

export const getFamiliesAction = async (): Promise<
  | { success: true; data: FamilyListItem[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const { families } = await client.request<GetFamiliesResponse>(Document);
    return { success: true as const, data: families };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to load families",
    };
  }
};
