"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const UpdateRoleMembersDocument = gql`
  mutation UpdateRoleMembers($input: UpdateRoleMembersInput!) {
    updateRoleMembers(input: $input) {
      id
    }
  }
`;

export const updateRoleMembersAction = async (
  roleId: string,
  membershipIds: string[]
) => {
  const client = await serverCookieGqlClient();

  try {
    await client.request(UpdateRoleMembersDocument, {
      input: { roleId, membershipIds },
    });
    return { success: true as const };
  } catch (error) {
    console.error("updateRoleMembers failed", error);
    return { success: false as const, error: extractGqlMessage(error) };
  }
};

function extractGqlMessage(error: unknown): string | undefined {
  const response = (error as { response?: { errors?: { message?: string }[] } })
    .response;
  return response?.errors?.[0]?.message;
}
