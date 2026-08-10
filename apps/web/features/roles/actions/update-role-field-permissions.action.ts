"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type RoleFieldPermissionEntry = {
  resource: string;
  field: string;
  actions: ("create" | "read" | "update" | "delete")[];
};

const UpdateRoleFieldPermissionsDocument = gql`
  mutation UpdateRoleFieldPermissions($input: UpdateRoleFieldPermissionsInput!) {
    updateRoleFieldPermissions(input: $input) {
      id
    }
  }
`;

export const updateRoleFieldPermissionsAction = async (
  roleId: string,
  fieldPermissions: RoleFieldPermissionEntry[]
) => {
  const client = await serverCookieGqlClient();

  try {
    await client.request(UpdateRoleFieldPermissionsDocument, {
      input: { roleId, fieldPermissions },
    });
    return { success: true as const };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
