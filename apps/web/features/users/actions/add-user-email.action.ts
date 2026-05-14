"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

const AddUserEmailDocument = gql`
  mutation AddUserEmail($userId: ID!, $email: String!) {
    addUserEmail(userId: $userId, email: $email) {
      id
      email
      isPrimary
      isVerified
    }
  }
`;

export const addUserEmailAction = async (userId: string, email: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { addUserEmail } = await client.request<{
      addUserEmail: {
        id: string;
        email: string;
        isPrimary: boolean;
        isVerified: boolean;
      };
    }>(AddUserEmailDocument, { userId, email: email.trim().toLowerCase() });

    revalidatePath(`/${locale}/admin/users/edit`);
    return { success: true as const, data: addUserEmail };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to add email",
    };
  }
};
