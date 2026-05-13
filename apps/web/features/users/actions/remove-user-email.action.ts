"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

const RemoveUserEmailDocument = gql`
  mutation RemoveUserEmail($id: ID!) {
    removeUserEmail(id: $id) {
      id
    }
  }
`;

export const removeUserEmailAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { removeUserEmail } = await client.request<{
      removeUserEmail: { id: string };
    }>(RemoveUserEmailDocument, { id });

    revalidatePath(`/${locale}/admin/users/edit`);
    return { success: true as const, data: removeUserEmail };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to remove email",
    };
  }
};
