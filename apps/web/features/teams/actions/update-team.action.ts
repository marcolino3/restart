"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const Document = gql`
  mutation UpdateTeam($input: UpdateTeamInput!) {
    updateTeam(input: $input) {
      id
      name
    }
  }
`;

type Response = { updateTeam: { id: string; name: string } };

export const updateTeamAction = async (input: {
  id: string;
  name: string;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateTeam } = await client.request<Response>(Document, { input });
    revalidatePath(`/${locale}/admin/teams`);
    revalidatePath(`/${locale}/admin/teams/${input.id}`);
    return { success: true as const, data: updateTeam };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
