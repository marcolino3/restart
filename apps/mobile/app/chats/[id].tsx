import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "@/lib/auth-client";
import { setActiveOrg } from "@/lib/gql-client";
import { gqlErrorMessage } from "@/lib/time-tracking";
import { t } from "@/lib/i18n";
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  sendMessage,
  type ChatMessage,
} from "@/features/chats/chats-api";
import { createChatWsClient } from "@/features/chats/ws-client";
import { ChatBubble } from "@/features/chats/ChatBubble";
import { dayLabel } from "@/features/chats/chat-display";

const MESSAGE_ADDED_SUBSCRIPTION = /* GraphQL */ `
  subscription MessageAdded($conversationId: ID!) {
    messageAdded(conversationId: $conversationId) {
      id
      body
      createdAt
      editedAt
      senderMembershipId
      sender { id user { id firstName lastName } }
    }
  }
`;

type Row =
  | { kind: "day"; key: string; label: string }
  | { kind: "message"; key: string; message: ChatMessage; showSender: boolean };

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { data: session } = useSession();
  const activeOrgId =
    (session as { activeOrganizationId?: string | null } | undefined)
      ?.activeOrganizationId ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selfMembershipId, setSelfMembershipId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const wsRef = useRef<ReturnType<typeof createChatWsClient> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      if (activeOrgId) setActiveOrg(activeOrgId);
      // selfMembershipId comes from the conversation list query; fetch both.
      const [convData, msgs] = await Promise.all([
        fetchConversations(),
        fetchMessages(id),
      ]);
      setSelfMembershipId(convData.selfMembershipId);
      setMessages(msgs);
      await markConversationRead(id);
    } catch (e) {
      setError(gqlErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id, activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime subscription over graphql-ws.
  useEffect(() => {
    if (!id) return;
    const client = createChatWsClient();
    wsRef.current = client;
    const unsubscribe = client.subscribe<{ messageAdded: ChatMessage }>(
      {
        query: MESSAGE_ADDED_SUBSCRIPTION,
        variables: { conversationId: id },
      },
      {
        next: ({ data }) => {
          const msg = data?.messageAdded;
          if (!msg) return;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
          void markConversationRead(id);
        },
        error: () => {},
        complete: () => {},
      },
    );
    return () => {
      unsubscribe();
      client.dispose();
      wsRef.current = null;
    };
  }, [id]);

  // Build rows newest-last, with day dividers. FlatList is inverted, so we
  // reverse for rendering.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastDay = "";
    let lastSender: string | null | undefined;
    for (const m of messages) {
      const day = dayLabel(m.createdAt);
      if (day !== lastDay) {
        out.push({ kind: "day", key: `day-${day}-${m.id}`, label: day });
        lastDay = day;
        lastSender = undefined;
      }
      out.push({
        kind: "message",
        key: m.id,
        message: m,
        showSender: m.senderMembershipId !== lastSender,
      });
      lastSender = m.senderMembershipId;
    }
    return out.reverse();
  }, [messages]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending || !id) return;
    setSending(true);
    setDraft("");
    try {
      const msg = await sendMessage(id, body);
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    } catch (e) {
      setError(gqlErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-card" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-border px-3 py-2.5">
        <Pressable onPress={() => router.back()} className="p-1">
          <FontAwesome name="chevron-left" size={18} color="#3a7d44" />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 text-base font-semibold text-foreground"
        >
          {title ?? t("Chats.pageTitle")}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-destructive">{error}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            data={rows}
            inverted
            keyExtractor={(row) => row.key}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            renderItem={({ item }) =>
              item.kind === "day" ? (
                <View className="items-center py-1">
                  <Text className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {item.label}
                  </Text>
                </View>
              ) : (
                <ChatBubble
                  message={item.message}
                  mine={item.message.senderMembershipId === selfMembershipId}
                  showSender={item.showSender}
                />
              )
            }
          />
          <View className="flex-row items-center gap-2 border-t border-border px-3 py-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t("Chats.messagePlaceholder", {
                name: title ?? "",
              })}
              placeholderTextColor="#9ca3af"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-base text-foreground"
              onSubmitEditing={() => void handleSend()}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => void handleSend()}
              disabled={!draft.trim() || sending}
              className={`h-11 w-11 items-center justify-center rounded-full ${
                !draft.trim() || sending ? "bg-muted" : "bg-primary"
              }`}
            >
              <FontAwesome
                name="send"
                size={16}
                color={!draft.trim() || sending ? "#9ca3af" : "#fff"}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
