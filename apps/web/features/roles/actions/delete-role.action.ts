"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const DeleteRoleDocument = gql`
  mutation DeleteRole($roleId: ID!) {
    deleteRole(roleId: $roleId)
  }
`;

export const deleteRoleAction = async (roleId: string) => {
  const client = await serverCookieGqlClient();

  try {
    await client.request(DeleteRoleDocument, { roleId });
    return { success: true as const };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
