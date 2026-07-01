"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const ChangeUserEmailDocument = gql`
  mutation ChangeUserEmail($input: ChangeUserEmailInput!) {
    changeUserEmail(input: $input) {
      id
      userEmails {
        id
        email
        isPrimary
        isVerified
      }
    }
  }
`;

/**
 * Ändert die primäre E-Mail eines Users. Aktualisiert serverseitig atomar
 * `user_emails` UND die better-auth Login-Identität. Admin/HR only.
 */
export const changeUserEmailAction = async (
  userId: string,
  newEmail: string
) => {
  const client = await serverCookieGqlClient();
  try {
    const { changeUserEmail } = await client.request<{
      changeUserEmail: {
        id: string;
        userEmails: {
          id: string;
          email: string;
          isPrimary: boolean;
          isVerified: boolean;
        }[];
      };
    }>(ChangeUserEmailDocument, { input: { userId, newEmail } });
    return { success: true as const, data: changeUserEmail };
  } catch (error) {
    return { success: false as const, error };
  }
};
