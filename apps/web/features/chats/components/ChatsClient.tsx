"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getMessagesAction } from "../actions/get-messages.action";
import { sendMessageAction } from "../actions/send-message.action";
import { markReadAction } from "../actions/mark-read.action";
import { getConversationsAction } from "../actions/get-conversations.action";
import { createChatWsClient } from "../lib/ws-client";
import { ChatUnreadProvider } from "../lib/chat-unread-context";
import { ConversationList } from "./ConversationList";
import { MessageThread, type ThreadMessage } from "./MessageThread";
import type { ConversationListItem } from "../lib/chat-display";

const MESSAGE_ADDED_SUBSCRIPTION = /* GraphQL */ `
  subscription MessageAdded($conversationId: ID!) {
    messageAdded(conversationId: $conversationId) {
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

interface Props {
  initialConversations: ConversationListItem[];
  selfMembershipId: string;
}

export function ChatsClient({
  initialConversations,
  selfMembershipId,
}: Props) {
  const t = useTranslations("Chats");
  const [conversations, setConversations] =
    useState<ConversationListItem[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversations[0]?.conversation.id ?? null,
  );
  const [messages, setMessages] = useState<ThreadMessage[]>([]);

  // The graphql-ws client is created once, lazily, and only in the browser.
  // useState's initializer runs a single time and never during SSR effects.
  const [wsClient] = useState(() =>
    typeof window === "undefined" ? null : createChatWsClient(),
  );

  // Dispose the socket on unmount.
  useEffect(() => {
    return () => {
      void wsClient?.dispose();
    };
  }, [wsClient]);

  const activeConversation = useMemo(
    () =>
      conversations.find((c) => c.conversation.id === activeId)?.conversation ??
      null,
    [conversations, activeId],
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations],
  );

  const refreshConversations = useCallback(async () => {
    const res = await getConversationsAction();
    if (res.success) setConversations(res.data.conversations);
  }, []);

  // Load messages + mark read whenever the active conversation changes.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getMessagesAction({ conversationId: activeId });
      if (!cancelled && res.success) setMessages(res.data);
      const read = await markReadAction(activeId);
      if (!cancelled && read.success) {
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation.id === activeId ? { ...c, unreadCount: 0 } : c,
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Subscribe to new messages of the active conversation over graphql-ws.
  useEffect(() => {
    if (!wsClient || !activeId) return;
    const unsubscribe = wsClient.subscribe<{ messageAdded: ThreadMessage }>(
      {
        query: MESSAGE_ADDED_SUBSCRIPTION,
        variables: { conversationId: activeId },
      },
      {
        next: ({ data }) => {
          const msg = data?.messageAdded;
          if (!msg) return;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
          // Keep the conversation list preview fresh; mark read since we're
          // looking at it.
          void refreshConversations();
          void markReadAction(activeId);
        },
        error: () => {
          /* graphql-ws retries automatically */
        },
        complete: () => {},
      },
    );
    return () => unsubscribe();
  }, [activeId, wsClient, refreshConversations]);

  const handleSend = useCallback(
    async (body: string) => {
      if (!activeId) return;
      const res = await sendMessageAction({ conversationId: activeId, body });
      if (!res.success) {
        toast.error(t("sendError"));
        return;
      }
      // Optimistically append; the subscription will dedupe by id.
      setMessages((prev) =>
        prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data],
      );
      void refreshConversations();
    },
    [activeId, refreshConversations, t],
  );

  return (
    <ChatUnreadProvider value={totalUnread}>
      <div className="flex h-[calc(100vh-var(--header-height,3.5rem))] w-full overflow-hidden">
        <div className="w-full max-w-xs shrink-0">
          <ConversationList
            items={conversations}
            selfMembershipId={selfMembershipId}
            activeId={activeId}
            onSelect={setActiveId}
            onNewChat={() => {
              /* new-chat dialog wired in a follow-up step */
            }}
          />
        </div>
        <MessageThread
          conversation={activeConversation}
          messages={messages}
          selfMembershipId={selfMembershipId}
          onSend={handleSend}
        />
      </div>
    </ChatUnreadProvider>
  );
}
