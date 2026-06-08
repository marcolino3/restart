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
      parentId
    }
  }
`;

type Response = { reorderTeams: TeamItem[] };

/**
 * Reorder one sibling group. Pass `parentId` to also re-parent the whole group
 * (drag-to-nest): `undefined` leaves parents untouched, `null` moves to root,
 * an id nests the group under that team.
 */
export const reorderTeamsAction = async (
  ids: string[],
  parentId?: string | null,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const input = parentId === undefined ? { ids } : { ids, parentId };
    const { reorderTeams } = await client.request<Response>(Document, {
      input,
    });
    revalidatePath(`/${locale}/admin/teams`);
    return { success: true as const, data: reorderTeams };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
