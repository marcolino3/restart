"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const RolesByOrganizationIdDocument = gql`
  query RolesByOrganizationId($organizationId: ID!) {
    rolesByOrganizationId(organizationId: $organizationId) {
      id
      name
      systemCode
      isSystem
    }
  }
`;

export type OrgRole = {
  id: string;
  name: string;
  systemCode: string | null;
  isSystem: boolean;
};

export const getRolesByOrgAction = async (organizationId: string) => {
  const client = await serverCookieGqlClient();

  try {
    const { rolesByOrganizationId } = await client.request<{
      rolesByOrganizationId: OrgRole[];
    }>(RolesByOrganizationIdDocument, { organizationId });
    return { success: true as const, data: rolesByOrganizationId };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load roles" };
  }
};
