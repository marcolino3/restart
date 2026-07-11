import { Linking, Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { MessageAttachment } from "./chats-api";
import { attachmentUrl } from "./chats-api";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  attachments: MessageAttachment[];
  mine: boolean;
}

/**
 * Renders a message's attachments as tappable chips that open the file in the
 * system browser (authenticated /api/chat-attachments/:id route). Mirrors the
 * web MessageAttachments; token-based styling sits inside either bubble colour.
 */
export function MessageAttachments({ attachments, mine }: Props) {
  if (attachments.length === 0) return null;
  return (
    <View className="flex-col gap-1">
      {attachments.map((att) => {
        const isImage = att.mimeType.startsWith("image/");
        return (
          <Pressable
            key={att.id}
            onPress={() => void Linking.openURL(attachmentUrl(att.id))}
            className={`flex-row items-center gap-2 rounded-lg px-2.5 py-1.5 ${
              mine ? "bg-primary-foreground/15" : "bg-background/70"
            }`}
          >
            <FontAwesome
              name={isImage ? "file-image-o" : "file-text-o"}
              size={13}
              color={mine ? "#ffffff" : "#6b7280"}
            />
            <Text
              numberOfLines={1}
              className={`min-w-0 flex-1 text-xs ${
                mine ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {att.originalName}
            </Text>
            <Text
              className={`text-xs ${
                mine ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}
            >
              {humanSize(att.sizeBytes)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
