import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { ensureActiveOrg } from "@/lib/active-org";
import { gqlErrorMessage } from "@/lib/time-tracking";
import { useColors, withAlpha } from "@/lib/theme";
import { t } from "@/lib/i18n";
import {
  fetchContacts,
  createConversation,
  type ChatContact,
} from "@/features/chats/chats-api";
import { userName, initials } from "@/features/chats/chat-display";

type Contact = { id: string; name: string };

/**
 * "New chat" modal, mirroring the web NewChatDialog: pick one contact for a
 * direct chat, or several (plus a name) for a group. On create we navigate
 * straight into the fresh conversation.
 */
export default function NewChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await ensureActiveOrg(null);
        const list: ChatContact[] = await fetchContacts();
        setContacts(
          list.map((c) => ({
            id: c.id,
            name: userName(c.user, t("Chats.formerMember")),
          })),
        );
      } catch (e) {
        setError(gqlErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      contacts.filter((c) =>
        c.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [contacts, query],
  );

  const isGroup = selected.length > 1;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleCreate = async () => {
    if (selected.length === 0 || submitting) return;
    if (isGroup && !groupName.trim()) {
      setError(t("Chats.groupNameLabel"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const conv = await createConversation({
        type: isGroup ? "GROUP" : "DIRECT",
        name: isGroup ? groupName.trim() : null,
        participantMembershipIds: selected,
      });
      router.replace({
        pathname: "/chats/[id]",
        params: { id: conv.id },
      });
    } catch (e) {
      setError(gqlErrorMessage(e));
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-card" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-primary">{t("Chats.cancel")}</Text>
        </Pressable>
        <Text className="text-base font-semibold text-foreground">
          {isGroup ? t("Chats.newGroupTitle") : t("Chats.newDirectTitle")}
        </Text>
        <Pressable
          onPress={() => void handleCreate()}
          disabled={selected.length === 0 || submitting}
          hitSlop={8}
        >
          <Text
            className={`text-base font-semibold ${
              selected.length === 0 || submitting
                ? "text-muted-foreground"
                : "text-primary"
            }`}
          >
            {t("Chats.create")}
          </Text>
        </Pressable>
      </View>

      <View className="gap-2 px-4 py-3">
        {isGroup ? (
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder={t("Chats.groupNamePlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            className="rounded-md border border-border bg-background px-3 py-2.5 text-base text-foreground"
          />
        ) : null}
        <View className="flex-row items-center gap-2 rounded-md border border-border bg-background px-3">
          <FontAwesome name="search" size={14} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("Chats.searchPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 py-2.5 text-base text-foreground"
          />
        </View>
      </View>

      {error ? (
        <Text className="px-4 pb-2 text-sm text-destructive">{error}</Text>
      ) : null}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 16 }}
          ListEmptyComponent={
            <Text className="px-4 py-10 text-center text-sm text-muted-foreground">
              {t("Chats.emptyListTitle")}
            </Text>
          }
          renderItem={({ item }) => {
            const active = selected.includes(item.id);
            return (
              <Pressable
                onPress={() => toggle(item.id)}
                className={`flex-row items-center gap-3 rounded-lg px-2 py-2.5 ${
                  active ? "" : "active:bg-muted"
                }`}
                style={
                  active
                    ? { backgroundColor: withAlpha(colors.primary, 0.1) }
                    : undefined
                }
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Text className="text-xs font-semibold text-muted-foreground">
                    {initials(item.name)}
                  </Text>
                </View>
                <Text className="flex-1 text-sm text-foreground">
                  {item.name}
                </Text>
                {active ? (
                  <FontAwesome name="check" size={16} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
