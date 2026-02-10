"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type PermissionItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type GetPermissionsResponse = {
  permissions: PermissionItem[];
};

const GetPermissionsDocument = gql`
  query GetPermissions {
    permissions {
      id
      code
      name
      description
    }
  }
`;

export const getPermissionsAction = async () => {
  const client = await serverCookieGqlClient();

  try {
    const data: GetPermissionsResponse = await client.request(
      GetPermissionsDocument
    );
    return { success: true as const, data: data.permissions };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
