import { gql } from "graphql-request";
import { gqlClient } from "@/lib/gql-client";

export type ConversationType = "DIRECT" | "GROUP" | "TEAM";

export type ChatUser = {
  id: string;
  firstName: string;
  lastName: string;
};

export type ChatParticipant = {
  id: string;
  membershipId: string;
  role: "MEMBER" | "ADMIN";
  membership?: { id: string; user?: ChatUser | null } | null;
};

export type ChatConversation = {
  id: string;
  type: ConversationType;
  name?: string | null;
  teamId?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  team?: { id: string; name: string } | null;
  participants?: ChatParticipant[] | null;
};

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  senderMembershipId?: string | null;
  sender?: { id: string; user?: ChatUser | null } | null;
};

export type ConversationListItem = {
  unreadCount: number;
  lastMessage?: Pick<ChatMessage, "id" | "body" | "createdAt"> | null;
  conversation: ChatConversation;
};

const MyConversationsDocument = gql`
  query MyConversations {
    myChatMembershipId
    myConversations {
      unreadCount
      lastMessage {
        id
        body
        createdAt
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
`;

const ConversationMessagesDocument = gql`
  query ConversationMessages($conversationId: ID!, $before: ID, $limit: Int) {
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
    }
  }
`;

const SendMessageDocument = gql`
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
`;

const MarkConversationReadDocument = gql`
  mutation MarkConversationRead($conversationId: ID!) {
    markConversationRead(conversationId: $conversationId) {
      id
      lastReadAt
    }
  }
`;

export async function fetchConversations(): Promise<{
  selfMembershipId: string;
  conversations: ConversationListItem[];
}> {
  const data = await gqlClient.request<{
    myChatMembershipId: string;
    myConversations: ConversationListItem[];
  }>(MyConversationsDocument);
  return {
    selfMembershipId: data.myChatMembershipId,
    conversations: data.myConversations,
  };
}

export async function fetchMessages(
  conversationId: string,
  opts?: { before?: string; limit?: number },
): Promise<ChatMessage[]> {
  const data = await gqlClient.request<{
    conversationMessages: ChatMessage[];
  }>(ConversationMessagesDocument, {
    conversationId,
    before: opts?.before,
    limit: opts?.limit ?? 30,
  });
  return data.conversationMessages;
}

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<ChatMessage> {
  const data = await gqlClient.request<{ sendMessage: ChatMessage }>(
    SendMessageDocument,
    { input: { conversationId, body } },
  );
  return data.sendMessage;
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  await gqlClient.request(MarkConversationReadDocument, { conversationId });
}
