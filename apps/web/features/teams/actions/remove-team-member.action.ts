"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const Document = gql`
  mutation RemoveTeamMember($id: ID!) {
    deleteTeamMember(id: $id)
  }
`;

export const removeTeamMemberAction = async (
  teamMemberId: string,
  teamId: string,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const result = await client.request<{ deleteTeamMember: boolean }>(
      Document,
      { id: teamMemberId },
    );
    revalidatePath(`/${locale}/admin/teams`);
    revalidatePath(`/${locale}/admin/teams/${teamId}`);
    return { success: true as const, data: result.deleteTeamMember };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
