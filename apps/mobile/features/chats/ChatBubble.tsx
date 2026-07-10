import { Text, View } from "react-native";
import { formatTime } from "./chat-display";
import { t } from "@/lib/i18n";
import type { ChatMessage } from "./chats-api";
import { senderName } from "./chat-display";

interface Props {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
}

/**
 * A single chat message bubble. Own messages sit right (primary/green), others
 * left (muted) — mirrors the web design. Styling is token-based (NativeWind),
 * no per-instance colours.
 */
export function ChatBubble({ message, mine, showSender }: Props) {
  return (
    <View className={mine ? "items-end" : "items-start"}>
      {!mine && showSender ? (
        <Text className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">
          {senderName(message, t("Chats.formerMember"))}
        </Text>
      ) : null}
      <View
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
          mine ? "bg-primary" : "bg-muted"
        }`}
      >
        <Text
          className={mine ? "text-primary-foreground" : "text-foreground"}
        >
          {message.body}
        </Text>
      </View>
      <Text className="mt-0.5 px-1 text-[10px] text-muted-foreground">
        {formatTime(message.createdAt)}
        {message.editedAt ? ` · ${t("Chats.edited")}` : ""}
      </Text>
    </View>
  );
}
