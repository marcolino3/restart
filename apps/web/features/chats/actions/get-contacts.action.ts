"use server";

import { graphql } from "@restart/shared-types";
import { ChatContactsQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const ChatContactsDocument = graphql(`
  query ChatContacts {
    chatContacts {
      id
      user {
        id
        firstName
        lastName
      }
    }
  }
`);

export async function getContactsAction() {
  const client = await serverCookieGqlClient();
  try {
    const { chatContacts } =
      await client.request<ChatContactsQuery>(ChatContactsDocument);
    return { success: true as const, data: chatContacts };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
