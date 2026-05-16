"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type { TeamItem } from "./get-teams.action";

const Document = gql`
  mutation ReorderTeams($input: ReorderTeamsInput!) {
    reorderTeams(input: $input) {
      id
      name
      sortOrder
    }
  }
`;

type Response = { reorderTeams: TeamItem[] };

export const reorderTeamsAction = async (ids: string[]) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { reorderTeams } = await client.request<Response>(Document, {
      input: { ids },
    });
    revalidatePath(`/${locale}/admin/teams`);
    return { success: true as const, data: reorderTeams };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
