"use server";

import { graphql } from "@restart/shared-types";
import { DeleteMessageMutation } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const DeleteMessageDocument = graphql(`
  mutation DeleteMessage($messageId: ID!) {
    deleteMessage(messageId: $messageId)
  }
`);

export async function deleteMessageAction(messageId: string) {
  const client = await serverCookieGqlClient();
  try {
    await client.request<DeleteMessageMutation>(DeleteMessageDocument, {
      messageId,
    });
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
