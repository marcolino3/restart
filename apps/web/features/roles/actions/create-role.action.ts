"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const CreateRoleDocument = gql`
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
    }
  }
`;

export const createRoleAction = async (
  name: string,
  description?: string,
  permissionCodes?: string[]
) => {
  const client = await serverCookieGqlClient();

  try {
    await client.request(CreateRoleDocument, {
      input: { name, description, permissionCodes },
    });
    return { success: true as const };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
