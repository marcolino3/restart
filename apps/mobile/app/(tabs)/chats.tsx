import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useRouter } from "expo-router";
import { useSession } from "@/lib/auth-client";
import { setActiveOrg } from "@/lib/gql-client";
import { gqlErrorMessage } from "@/lib/time-tracking";
import { t } from "@/lib/i18n";
import {
  fetchConversations,
  type ConversationListItem,
} from "@/features/chats/chats-api";
import {
  conversationTitle,
  initials,
  formatTime,
} from "@/features/chats/chat-display";

type Filter = "all" | "DIRECT" | "GROUP" | "TEAM";

export default function ChatsTab() {
  const router = useRouter();
  const { data: session } = useSession();
  const activeOrgId =
    (session as { activeOrganizationId?: string | null } | undefined)
      ?.activeOrganizationId ?? null;

  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [selfMembershipId, setSelfMembershipId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    try {
      setError(null);
      if (activeOrgId) setActiveOrg(activeOrgId);
      const result = await fetchConversations();
      setItems(result.conversations);
      setSelfMembershipId(result.selfMembershipId);
    } catch (e) {
      setError(gqlErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.conversation.type !== filter) return false;
      if (!query.trim()) return true;
      const title = conversationTitle(item.conversation, selfMembershipId);
      return title.toLowerCase().includes(query.trim().toLowerCase());
    });
  }, [items, filter, query, selfMembershipId]);

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: t("Chats.filterAll") },
    { key: "DIRECT", label: t("Chats.filterDirect") },
    { key: "GROUP", label: t("Chats.filterGroups") },
    { key: "TEAM", label: t("Chats.filterTeams") },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 pb-2 pt-3">
        <Text className="mb-3 text-2xl font-bold text-foreground">
          {t("Chats.pageTitle")}
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("Chats.searchPlaceholder")}
          placeholderTextColor="#9ca3af"
          className="rounded-md border border-border bg-background px-3 py-2.5 text-base text-foreground"
        />
        <View className="mt-2 flex-row gap-1">
          {filterTabs.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              className={`rounded-full px-3 py-1 ${
                filter === key ? "bg-primary" : "bg-muted"
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  filter === key
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
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
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.conversation.id}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 16 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => void load()} />
          }
          ListEmptyComponent={
            <View className="items-center px-4 py-16">
              <Text className="text-sm font-medium text-foreground">
                {t("Chats.emptyListTitle")}
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                {t("Chats.emptyListHint")}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const { conversation, lastMessage, unreadCount } = item;
            const title = conversationTitle(conversation, selfMembershipId);
            const isGroup =
              conversation.type === "GROUP" || conversation.type === "TEAM";
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/chats/[id]",
                    params: { id: conversation.id, title },
                  })
                }
                className="flex-row items-center gap-3 rounded-lg px-2 py-2.5 active:bg-muted"
              >
                <View
                  className={`h-11 w-11 items-center justify-center rounded-full ${
                    isGroup ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  {isGroup ? (
                    <FontAwesome name="users" size={16} color="#3a7d44" />
                  ) : (
                    <Text className="text-xs font-semibold text-muted-foreground">
                      {initials(title)}
                    </Text>
                  )}
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-sm font-medium text-foreground"
                    >
                      {title}
                    </Text>
                    {lastMessage ? (
                      <Text className="ml-2 text-[11px] text-muted-foreground">
                        {formatTime(lastMessage.createdAt)}
                      </Text>
                    ) : null}
                  </View>
                  <View className="mt-0.5 flex-row items-center justify-between">
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-xs text-muted-foreground"
                    >
                      {lastMessage?.body ?? ""}
                    </Text>
                    {unreadCount > 0 ? (
                      <View className="ml-2 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5">
                        <Text className="text-[11px] font-semibold text-primary-foreground">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
