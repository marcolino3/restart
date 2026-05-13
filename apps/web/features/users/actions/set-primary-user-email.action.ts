"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

const SetPrimaryUserEmailDocument = gql`
  mutation SetPrimaryUserEmail($id: ID!) {
    setPrimaryUserEmail(id: $id) {
      id
      isPrimary
    }
  }
`;

export const setPrimaryUserEmailAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { setPrimaryUserEmail } = await client.request<{
      setPrimaryUserEmail: { id: string; isPrimary: boolean };
    }>(SetPrimaryUserEmailDocument, { id });

    revalidatePath(`/${locale}/admin/users/edit`);
    return { success: true as const, data: setPrimaryUserEmail };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to set primary email",
    };
  }
};
