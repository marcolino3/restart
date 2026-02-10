"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const UpdateRolePermissionsDocument = gql`
  mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {
    updateRolePermissions(input: $input) {
      id
      permissions {
        id
        code
      }
    }
  }
`;

export const updateRolePermissionsAction = async (
  roleId: string,
  permissionCodes: string[]
) => {
  const client = await serverCookieGqlClient();

  try {
    await client.request(UpdateRolePermissionsDocument, {
      input: { roleId, permissionCodes },
    });
    return { success: true as const };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
