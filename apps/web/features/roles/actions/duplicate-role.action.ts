"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const DuplicateRoleDocument = gql`
  mutation DuplicateRole($input: DuplicateRoleInput!) {
    duplicateRole(input: $input) {
      id
    }
  }
`;

export const duplicateRoleAction = async (
  sourceRoleId: string,
  name: string
) => {
  const client = await serverCookieGqlClient();

  try {
    await client.request(DuplicateRoleDocument, {
      input: { sourceRoleId, name },
    });
    return { success: true as const };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
