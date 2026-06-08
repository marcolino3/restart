"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type { TeamMemberRole } from "./get-team-members.action";

const Document = gql`
  mutation UpdateTeamMemberRole($input: UpdateTeamMemberInput!) {
    updateTeamMember(input: $input) {
      id
      role
    }
  }
`;

type Response = { updateTeamMember: { id: string; role: TeamMemberRole } };

export const updateTeamMemberRoleAction = async (input: {
  id: string;
  role: TeamMemberRole;
  teamId: string;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateTeamMember } = await client.request<Response>(Document, {
      input: { id: input.id, role: input.role },
    });
    revalidatePath(`/${locale}/admin/teams/${input.teamId}`);
    return { success: true as const, data: updateTeamMember };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
