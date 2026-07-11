"use server";

import { graphql } from "@restart/shared-types";
import { ConversationMessagesQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const ConversationMessagesDocument = graphql(`
  query ConversationMessages(
    $conversationId: ID!
    $before: ID
    $limit: Int
  ) {
    conversationMessages(
      conversationId: $conversationId
      before: $before
      limit: $limit
    ) {
      id
      body
      createdAt
      editedAt
      senderMembershipId
      sender {
        id
        user {
          id
          firstName
          lastName
        }
      }
      attachments {
        id
        originalName
        mimeType
        sizeBytes
      }
    }
  }
`);

export async function getMessagesAction(args: {
  conversationId: string;
  before?: string;
  limit?: number;
}) {
  const client = await serverCookieGqlClient();
  try {
    const { conversationMessages } =
      await client.request<ConversationMessagesQuery>(
        ConversationMessagesDocument,
        args,
      );
    return { success: true as const, data: conversationMessages };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
