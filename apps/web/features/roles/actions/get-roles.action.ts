"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type RoleMember = {
  id: string;
  user: { id: string; firstName: string; lastName: string } | null;
};

export type RoleWithPermissions = {
  id: string;
  name: string | null;
  systemCode: string | null;
  isSystem: boolean;
  permissions: { id: string; code: string; name: string }[] | null;
  memberships: RoleMember[] | null;
};

type GetRolesResponse = {
  rolesByOrgId: RoleWithPermissions[];
};

const GetRolesDocument = gql`
  query GetRolesByOrgId {
    rolesByOrgId {
      id
      name
      systemCode
      isSystem
      permissions {
        id
        code
        name
      }
      memberships {
        id
        user {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

export const getRolesAction = async () => {
  const client = await serverCookieGqlClient();

  try {
    const data: GetRolesResponse = await client.request(GetRolesDocument);
    return { success: true as const, data: data.rolesByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
