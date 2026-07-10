"use server";

import { graphql } from "@restart/shared-types";
import { SendMessageMutation } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const SendMessageDocument = graphql(`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      body
      createdAt
      senderMembershipId
      sender {
        id
        user {
          id
          firstName
          lastName
        }
      }
    }
  }
`);

export async function sendMessageAction(input: {
  conversationId: string;
  body: string;
}) {
  const client = await serverCookieGqlClient();
  try {
    const { sendMessage } = await client.request<SendMessageMutation>(
      SendMessageDocument,
      { input },
    );
    return { success: true as const, data: sendMessage };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
