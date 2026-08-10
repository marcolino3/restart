"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const UpdateRoleDocument = gql`
  mutation UpdateRole($input: UpdateRoleInput!) {
    updateRole(input: $input) {
      id
    }
  }
`;

export const updateRoleAction = async (
  id: string,
  name?: string,
  description?: string,
  permissionCodes?: string[]
) => {
  const client = await serverCookieGqlClient();

  try {
    await client.request(UpdateRoleDocument, {
      input: { id, name, description, permissionCodes },
    });
    return { success: true as const };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
