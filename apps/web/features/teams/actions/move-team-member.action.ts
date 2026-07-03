"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type { TeamMemberRole } from "./get-team-members.action";

const Document = gql`
  mutation MoveTeamMember($input: UpdateTeamMemberInput!) {
    updateTeamMember(input: $input) {
      id
      role
    }
  }
`;

type Response = { updateTeamMember: { id: string; role: TeamMemberRole } };

/**
 * Moves an existing membership to another team. The row (and its role) is kept
 * — only `teamId` changes. Used by the Teams board when a member is dragged
 * from one team card onto another.
 */
export const moveTeamMemberAction = async (
  teamMemberId: string,
  targetTeamId: string,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateTeamMember } = await client.request<Response>(Document, {
      input: { id: teamMemberId, teamId: targetTeamId },
    });
    revalidatePath(`/${locale}/admin/teams`);
    return { success: true as const, data: updateTeamMember };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
