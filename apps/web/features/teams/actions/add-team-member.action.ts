"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const Document = gql`
  mutation AddTeamMember($input: CreateTeamMemberInput!) {
    createTeamMember(input: $input) {
      id
    }
  }
`;

type Response = { createTeamMember: { id: string } };

export const addTeamMemberAction = async (input: {
  teamId: string;
  employeeId: string;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createTeamMember } = await client.request<Response>(Document, {
      input,
    });
    revalidatePath(`/${locale}/admin/teams/${input.teamId}`);
    return { success: true as const, data: createTeamMember };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
