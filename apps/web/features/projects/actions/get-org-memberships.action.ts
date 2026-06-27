"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { MembershipRef } from "../types";

type Response = { membershipsByOrgId: MembershipRef[] };

const Document = gql`
  query MembershipsByOrgId($organizationId: ID!) {
    membershipsByOrgId(organizationId: $organizationId) {
      id
      userId
      user {
        firstName
        lastName
      }
      userEmail {
        email
      }
    }
  }
`;

/** All memberships of an org — source for the member / assignee pickers. */
export const getOrgMembershipsAction = async (organizationId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { membershipsByOrgId } = await client.request<Response>(Document, {
      organizationId,
    });
    return { success: true as const, data: membershipsByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
