"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const Document = gql`
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id)
  }
`;

export const deleteTeamAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const result = await client.request<{ deleteTeam: boolean }>(Document, {
      id,
    });
    revalidatePath(`/${locale}/admin/teams`);
    return { success: true as const, data: result.deleteTeam };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to delete team" };
  }
};
