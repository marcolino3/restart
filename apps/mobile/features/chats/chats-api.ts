import { gql } from "graphql-request";
import { gqlClient } from "@/lib/gql-client";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL } from "@/lib/env";

export type ConversationType = "DIRECT" | "GROUP" | "TEAM";

export type ChatUser = {
  id: string;
  firstName: string;
  lastName: string;
};

export type MessageAttachment = {
  id: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
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
  attachments?: MessageAttachment[] | null;
};

export type ChatContact = { id: string; user?: ChatUser | null };

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
      attachments {
        id
        mimeType
        originalName
        sizeBytes
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
      attachments {
        id
        mimeType
        originalName
        sizeBytes
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

const ChatContactsDocument = gql`
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
`;

export async function fetchContacts(): Promise<ChatContact[]> {
  const data = await gqlClient.request<{ chatContacts: ChatContact[] }>(
    ChatContactsDocument,
  );
  return data.chatContacts;
}

const CreateConversationDocument = gql`
  mutation CreateConversation($input: CreateConversationInput!) {
    createConversation(input: $input) {
      id
      type
      name
    }
  }
`;

export async function createConversation(input: {
  type: ConversationType;
  name?: string | null;
  participantMembershipIds: string[];
}): Promise<{ id: string; type: ConversationType; name?: string | null }> {
  const data = await gqlClient.request<{
    createConversation: { id: string; type: ConversationType; name?: string | null };
  }>(CreateConversationDocument, { input });
  return data.createConversation;
}

const EditMessageDocument = gql`
  mutation EditMessage($messageId: ID!, $body: String!) {
    editMessage(messageId: $messageId, body: $body) {
      id
      body
      editedAt
    }
  }
`;

export async function editMessage(
  messageId: string,
  body: string,
): Promise<Pick<ChatMessage, "id" | "body" | "editedAt">> {
  const data = await gqlClient.request<{
    editMessage: Pick<ChatMessage, "id" | "body" | "editedAt">;
  }>(EditMessageDocument, { messageId, body });
  return data.editMessage;
}

const DeleteMessageDocument = gql`
  mutation DeleteMessage($messageId: ID!) {
    deleteMessage(messageId: $messageId)
  }
`;

export async function deleteMessage(messageId: string): Promise<void> {
  await gqlClient.request(DeleteMessageDocument, { messageId });
}

/** Absolute URL of an attachment's binary on the authenticated chat route. */
export function attachmentUrl(attachmentId: string): string {
  return `${API_BASE_URL}/api/chat-attachments/${attachmentId}`;
}

/**
 * Uploads a picked file into a conversation via the authenticated multipart
 * REST route. The backend creates a message carrying the attachment and
 * publishes it over the messageAdded subscription, so it arrives in realtime
 * like any text message — no GraphQL round-trip needed here.
 *
 * `credentials: "omit"` is required on React Native so the native cookie jar
 * doesn't override our manual Cookie header (same reason as gql-client.ts).
 */
export async function uploadAttachment(
  conversationId: string,
  file: { uri: string; name: string; mimeType: string },
): Promise<void> {
  const cookie = authClient.getCookie();
  const form = new FormData();
  // React Native's FormData takes {uri, name, type} for file parts.
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  const res = await fetch(
    `${API_BASE_URL}/api/chat-attachments?conversationId=${encodeURIComponent(
      conversationId,
    )}`,
    {
      method: "POST",
      credentials: "omit",
      headers: {
        "apollo-require-preflight": "true",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: form,
    },
  );
  if (!res.ok) {
    const msg = await res
      .json()
      .then((r: { message?: string }) => r?.message)
      .catch(() => null);
    throw new Error(msg ?? `Upload failed (${res.status})`);
  }
}
