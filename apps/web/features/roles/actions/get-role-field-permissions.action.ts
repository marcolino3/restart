"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type RoleFieldPermission = {
  resource: string;
  field: string;
  actions: string[];
};

type GetRoleFieldPermissionsResponse = {
  roleFieldPermissions: RoleFieldPermission[];
};

const GetRoleFieldPermissionsDocument = gql`
  query GetRoleFieldPermissions($roleId: ID!) {
    roleFieldPermissions(roleId: $roleId) {
      resource
      field
      actions
    }
  }
`;

export const getRoleFieldPermissionsAction = async (roleId: string) => {
  const client = await serverCookieGqlClient();

  try {
    const data: GetRoleFieldPermissionsResponse = await client.request(
      GetRoleFieldPermissionsDocument,
      { roleId }
    );
    return { success: true as const, data: data.roleFieldPermissions };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
