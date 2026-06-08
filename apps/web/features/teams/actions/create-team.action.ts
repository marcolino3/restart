"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const Document = gql`
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      id
      name
      sortOrder
      parentId
    }
  }
`;

type Response = {
  createTeam: {
    id: string;
    name: string;
    sortOrder: number;
    parentId: string | null;
  };
};

export const createTeamAction = async (
  name: string,
  parentId?: string | null,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createTeam } = await client.request<Response>(Document, {
      input: parentId ? { name, parentId } : { name },
    });
    revalidatePath(`/${locale}/admin/teams`);
    return { success: true as const, data: createTeam };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
