"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type { TeamMemberRole } from "./get-team-members.action";

const Document = gql`
  mutation AddTeamMember($input: CreateTeamMemberInput!) {
    createTeamMember(input: $input) {
      id
      role
    }
  }
`;

type Response = { createTeamMember: { id: string; role: TeamMemberRole } };

export const addTeamMemberAction = async (input: {
  teamId: string;
  employeeId: string;
  role?: TeamMemberRole;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createTeamMember } = await client.request<Response>(Document, {
      input,
    });
    revalidatePath(`/${locale}/admin/teams`);
    revalidatePath(`/${locale}/admin/teams/${input.teamId}`);
    return { success: true as const, data: createTeamMember };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
