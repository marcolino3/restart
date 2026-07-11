"use server";

import { graphql } from "@restart/shared-types";
import { EditMessageMutation } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const EditMessageDocument = graphql(`
  mutation EditMessage($messageId: ID!, $body: String!) {
    editMessage(messageId: $messageId, body: $body) {
      id
      body
      editedAt
    }
  }
`);

export async function editMessageAction(messageId: string, body: string) {
  const client = await serverCookieGqlClient();
  try {
    const { editMessage } = await client.request<EditMessageMutation>(
      EditMessageDocument,
      { messageId, body },
    );
    return { success: true as const, data: editMessage };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
