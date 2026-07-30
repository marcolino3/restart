"use server";

import { graphql } from "@restart/shared-types";
import { MyConversationsQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const MyConversationsDocument = graphql(`
  query MyConversations {
    myChatMembershipId
    myConversations {
      unreadCount
      lastMessage {
        id
        body
        createdAt
        senderMembershipId
      }
      conversation {
        id
        type
        name
        teamId
        lastMessageAt
        createdAt
        team {
          id
          name
        }
        participants {
          id
          membershipId
          role
          membership {
            id
            user {
              id
              firstName
              lastName
            }
          }
        }
      }
    }
  }
`);

export async function getConversationsAction() {
  const client = await serverCookieGqlClient();
  try {
    const { myConversations, myChatMembershipId } =
      await client.request<MyConversationsQuery>(MyConversationsDocument);
    return {
      success: true as const,
      data: { conversations: myConversations, selfMembershipId: myChatMembershipId },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
