"use server";

import { graphql } from "@restart/shared-types";
import { MarkConversationReadMutation } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const MarkConversationReadDocument = graphql(`
  mutation MarkConversationRead($conversationId: ID!) {
    markConversationRead(conversationId: $conversationId) {
      id
      lastReadAt
    }
  }
`);

export async function markReadAction(conversationId: string) {
  const client = await serverCookieGqlClient();
  try {
    const { markConversationRead } =
      await client.request<MarkConversationReadMutation>(
        MarkConversationReadDocument,
        { conversationId },
      );
    return { success: true as const, data: markConversationRead };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
