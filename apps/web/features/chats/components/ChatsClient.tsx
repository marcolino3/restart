"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getMessagesAction } from "../actions/get-messages.action";
import { sendMessageAction } from "../actions/send-message.action";
import { editMessageAction } from "../actions/edit-message.action";
import { deleteMessageAction } from "../actions/delete-message.action";
import { markReadAction } from "../actions/mark-read.action";
import { getConversationsAction } from "../actions/get-conversations.action";
import { createChatWsClient } from "../lib/ws-client";
import { ChatUnreadProvider } from "../lib/chat-unread-context";
import { ConversationList } from "./ConversationList";
import { MessageThread, type ThreadMessage } from "./MessageThread";
import { NewChatDialog } from "./NewChatDialog";
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
      attachments {
        id
        originalName
        mimeType
        sizeBytes
      }
    }
  }
`;

const MESSAGE_DELETED_SUBSCRIPTION = /* GraphQL */ `
  subscription MessageDeleted($conversationId: ID!) {
    messageDeleted(conversationId: $conversationId) {
      id
      conversationId
    }
  }
`;

// How many messages a page loads. The thread starts with the newest page and
// pulls older ones on demand, so a long history never loads all at once.
const PAGE_SIZE = 30;

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
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversations[0]?.conversation.id ?? null,
  );
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [newChatOpen, setNewChatOpen] = useState(false);

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

  // activeId is read via a ref so the polling effect doesn't need to re-run
  // (and tear down its interval) every time the open conversation changes.
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;
  const refreshConversations = useCallback(async () => {
    const res = await getConversationsAction();
    if (!res.success) return;
    // The open conversation is always considered read — the poll must not
    // resurrect an unread badge on the chat the user is currently looking at
    // (mark-read may not have round-tripped yet).
    setConversations(
      res.data.conversations.map((c) =>
        c.conversation.id === activeIdRef.current
          ? { ...c, unreadCount: 0 }
          : c,
      ),
    );
  }, []);

  const reloadMessages = useCallback(async (conversationId: string) => {
    const res = await getMessagesAction({
      conversationId,
      limit: PAGE_SIZE,
    });
    if (res.success) {
      setMessages(res.data);
      setHasMore(res.data.length >= PAGE_SIZE);
    }
  }, []);

  // Load one page of OLDER messages, prepended before the current ones. The
  // cursor is the oldest loaded message (messages are chronological, so
  // index 0). Returns how many were prepended so the view can keep scroll pos.
  const loadOlder = useCallback(async (): Promise<number> => {
    if (!activeIdRef.current || loadingOlder) return 0;
    const oldest = messages[0];
    if (!oldest) return 0;
    setLoadingOlder(true);
    try {
      const res = await getMessagesAction({
        conversationId: activeIdRef.current,
        before: oldest.id,
        limit: PAGE_SIZE,
      });
      if (!res.success) return 0;
      const older = res.data;
      setHasMore(older.length >= PAGE_SIZE);
      if (older.length === 0) return 0;
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const fresh = older.filter((m) => !seen.has(m.id));
        return [...fresh, ...prev];
      });
      return older.length;
    } finally {
      setLoadingOlder(false);
    }
  }, [messages, loadingOlder]);

  // Keep the conversation list (unread counts + last-message previews) fresh
  // even for conversations that are NOT currently open. The messageAdded
  // subscription only covers the active conversation, so a message arriving in
  // another chat would otherwise never surface its unread badge. A light poll
  // of the list closes that gap without a per-conversation subscription.
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshConversations]);

  // Load messages + mark read whenever the active conversation changes.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getMessagesAction({
        conversationId: activeId,
        limit: PAGE_SIZE,
      });
      if (!cancelled && res.success) {
        setMessages(res.data);
        // A full page back implies there may be older messages to load.
        setHasMore(res.data.length >= PAGE_SIZE);
      }
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
            prev.some((m) => m.id === msg.id)
              ? // Existing id → an edit: replace it in place.
                prev.map((m) => (m.id === msg.id ? msg : m))
              : [...prev, msg],
          );
          // Keep the conversation list preview fresh; mark read since we're
          // looking at it.
          void refreshConversations();
          void markReadAction(activeId);
        },
        error: (err) => {
          // Surface WS errors instead of silently retrying — otherwise a
          // failed handshake looks like "realtime just doesn't work".
           
          console.error("[chat ws] subscription error", err);
        },
        complete: () => {},
      },
    );
    // Parallel subscription for deletions — removes the message live.
    const unsubscribeDeleted = wsClient.subscribe<{
      messageDeleted: { id: string };
    }>(
      {
        query: MESSAGE_DELETED_SUBSCRIPTION,
        variables: { conversationId: activeId },
      },
      {
        next: ({ data }) => {
          const id = data?.messageDeleted?.id;
          if (!id) return;
          setMessages((prev) => prev.filter((m) => m.id !== id));
          void refreshConversations();
        },
        error: () => {},
        complete: () => {},
      },
    );
    return () => {
      unsubscribe();
      unsubscribeDeleted();
    };
  }, [activeId, wsClient, refreshConversations]);

  const handleSend = useCallback(
    async (body: string) => {
      if (!activeId) return;
      // Show the message immediately with a temporary id (optimistic), so it
      // appears the instant the user hits send regardless of backend latency.
      const tempId = `temp-${activeId}-${body.length}-${messages.length}`;
      const optimistic: ThreadMessage = {
        id: tempId,
        body,
        createdAt: new Date().toISOString(),
        editedAt: null,
        senderMembershipId: selfMembershipId,
        sender: null,
      };
      setMessages((prev) => [...prev, optimistic]);

      const res = await sendMessageAction({ conversationId: activeId, body });
      if (!res.success) {
        // Roll back the optimistic message on failure.
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(t("sendError"));
        return;
      }
      // Replace the optimistic entry with the persisted message (dedupe if the
      // subscription already delivered it).
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === res.data.id)
          ? withoutTemp
          : [...withoutTemp, res.data];
      });
      void refreshConversations();
    },
    [activeId, messages.length, selfMembershipId, refreshConversations, t],
  );

  const handleEdit = useCallback(
    async (messageId: string, body: string) => {
      // Optimistic: apply the edit locally right away.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, body, editedAt: new Date().toISOString() }
            : m,
        ),
      );
      const res = await editMessageAction(messageId, body);
      if (!res.success) {
        toast.error(res.error ?? t("editError"));
        if (activeIdRef.current) void reloadMessages(activeIdRef.current);
      }
    },
    [reloadMessages, t],
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      const res = await deleteMessageAction(messageId);
      if (!res.success) {
        toast.error(res.error ?? t("deleteError"));
        if (activeIdRef.current) void reloadMessages(activeIdRef.current);
      } else {
        void refreshConversations();
      }
    },
    [reloadMessages, refreshConversations, t],
  );

  return (
    <ChatUnreadProvider value={totalUnread}>
      {/* data-full-bleed tells the admin layout to drop its m-6/py-* wrapper
          spacing (see admin/layout.tsx). The messenger then simply fills the
          available height via flex-1 + min-h-0 — no viewport math. */}
      <div
        data-full-bleed
        className="flex min-h-0 flex-1 w-full overflow-hidden"
      >
        <div className="flex w-full max-w-xs shrink-0 flex-col">
          <ConversationList
            items={conversations}
            selfMembershipId={selfMembershipId}
            activeId={activeId}
            onSelect={setActiveId}
            onNewChat={() => setNewChatOpen(true)}
          />
        </div>
        <MessageThread
          conversation={activeConversation}
          messages={messages}
          selfMembershipId={selfMembershipId}
          onSend={handleSend}
          hasMore={hasMore}
          loadingOlder={loadingOlder}
          onLoadOlder={loadOlder}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAttached={() => {
            if (activeId) void reloadMessages(activeId);
            void refreshConversations();
          }}
        />
      </div>
      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onCreated={(conversationId) => {
          void refreshConversations();
          setActiveId(conversationId);
        }}
      />
    </ChatUnreadProvider>
  );
}
