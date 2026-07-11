import { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { formatTime, senderName, initials } from "./chat-display";
import { t } from "@/lib/i18n";
import type { ChatMessage } from "./chats-api";
import { MessageAttachments } from "./MessageAttachments";

interface Props {
  message: ChatMessage;
  mine: boolean;
  /** True at the start of a run of messages from the same sender. */
  startsRun: boolean;
  onEdit?: (messageId: string, body: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

/**
 * A single chat message bubble, mirroring the web MessageThread design:
 * - foreign messages sit left (muted, rounded-bl-md) with an initials avatar
 *   and the sender's name in the accent colour, both only at the start of a
 *   run of consecutive messages from that sender;
 * - own messages sit right (primary/green, rounded-br-md) and can be edited or
 *   deleted via a long-press action sheet, with an inline edit mode.
 * Styling is token-based (NativeWind) — no per-instance colours.
 */
export function ChatBubble({
  message,
  mine,
  startsRun,
  onEdit,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const attachments = message.attachments ?? [];
  const author = senderName(message, t("Chats.formerMember"));

  const submitEdit = async () => {
    const body = draft.trim();
    if (body && body !== message.body && onEdit) {
      await onEdit(message.id, body);
    }
    setEditing(false);
  };

  const openActions = () => {
    if (!onEdit && !onDelete) return;
    const startEdit = () => {
      setDraft(message.body);
      setEditing(true);
    };
    const confirmDelete = () => {
      if (!onDelete) return;
      Alert.alert(t("Chats.delete"), t("Chats.deleteConfirm"), [
        { text: t("Chats.cancel"), style: "cancel" },
        {
          text: t("Chats.delete"),
          style: "destructive",
          onPress: () => void onDelete(message.id),
        },
      ]);
    };
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t("Chats.cancel"), t("Chats.edit"), t("Chats.delete")],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) startEdit();
          if (index === 2) confirmDelete();
        },
      );
    } else {
      Alert.alert(t("Chats.messageActions"), undefined, [
        { text: t("Chats.edit"), onPress: startEdit },
        {
          text: t("Chats.delete"),
          style: "destructive",
          onPress: confirmDelete,
        },
        { text: t("Chats.cancel"), style: "cancel" },
      ]);
    }
  };

  // Inline edit mode for own messages.
  if (editing) {
    return (
      <View className="flex-row items-center justify-end gap-2">
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => void submitEdit()}
          className="max-w-[70%] flex-1 rounded-full border border-border bg-background px-3.5 py-2 text-sm text-foreground"
        />
        <Pressable
          onPress={() => void submitEdit()}
          className="h-9 w-9 items-center justify-center rounded-full bg-primary"
        >
          <FontAwesome name="check" size={14} color="#fff" />
        </Pressable>
        <Pressable
          onPress={() => {
            setDraft(message.body);
            setEditing(false);
          }}
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
        >
          <FontAwesome name="close" size={14} color="#6b7280" />
        </Pressable>
      </View>
    );
  }

  if (mine) {
    return (
      <View className="items-end">
        <Pressable
          onLongPress={openActions}
          delayLongPress={250}
          className="max-w-[80%] flex-col gap-1.5 rounded-2xl rounded-br-md bg-primary px-3.5 py-2"
        >
          {message.body ? (
            <Text className="text-sm text-primary-foreground">
              {message.body}
            </Text>
          ) : null}
          <MessageAttachments attachments={attachments} mine />
        </Pressable>
        <Text className="mt-0.5 px-1 text-[10px] text-muted-foreground">
          {formatTime(message.createdAt)}
          {message.editedAt ? ` · ${t("Chats.edited")}` : ""}
        </Text>
      </View>
    );
  }

  // Foreign message: avatar column + name (only at the start of a run).
  return (
    <View className="flex-row items-end gap-2">
      <View
        className={`h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ${
          startsRun ? "" : "opacity-0"
        }`}
      >
        <Text className="text-[10px] font-semibold text-primary">
          {initials(author)}
        </Text>
      </View>
      <View className="max-w-[78%] flex-col items-start gap-0.5">
        {startsRun ? (
          <Text className="px-1 text-[11px] font-semibold text-primary">
            {author}
          </Text>
        ) : null}
        <View className="flex-col gap-1.5 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2">
          {message.body ? (
            <Text className="text-sm text-foreground">{message.body}</Text>
          ) : null}
          <MessageAttachments attachments={attachments} mine={false} />
        </View>
        <Text className="px-1 text-[10px] text-muted-foreground">
          {formatTime(message.createdAt)}
          {message.editedAt ? ` · ${t("Chats.edited")}` : ""}
        </Text>
      </View>
    </View>
  );
}
