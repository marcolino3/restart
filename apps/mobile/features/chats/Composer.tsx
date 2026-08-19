import { useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useColors } from "@/lib/theme";
import { t } from "@/lib/i18n";
import { uploadAttachment } from "./chats-api";

interface Props {
  conversationId: string;
  placeholder: string;
  onSend: (body: string) => Promise<void>;
  onError: (message: string) => void;
}

/**
 * Message composer matching the web design: attachment clip (left), an
 * auto-growing multiline input, an emoji button (focuses the input so the
 * system emoji keyboard is reachable — the documented Expo-Go-safe approach,
 * no extra dependency), and a send button (right).
 */
export function Composer({
  conversationId,
  placeholder,
  onSend,
  onError,
}: Props) {
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    setInputHeight(40);
    try {
      await onSend(body);
    } catch (e) {
      onError(e instanceof Error ? e.message : t("Chats.sendError"));
    } finally {
      setSending(false);
    }
  };

  const doUpload = async (file: {
    uri: string;
    name: string;
    mimeType: string;
  }) => {
    setUploading(true);
    try {
      await uploadAttachment(conversationId, file);
    } catch (e) {
      onError(e instanceof Error ? e.message : t("Chats.attachError"));
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    await doUpload({
      uri: asset.uri,
      name: asset.fileName ?? `image-${asset.assetId ?? "upload"}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    await doUpload({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? "application/octet-stream",
    });
  };

  const openAttach = () => {
    if (uploading) return;
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t("Chats.cancel"),
            t("Chats.attachImage"),
            t("Chats.attachFile"),
          ],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) void pickImage();
          if (index === 2) void pickFile();
        },
      );
    } else {
      // Android: no native sheet primitive here — default to the file picker,
      // which can select images too.
      void pickFile();
    }
  };

  const canSend = !!draft.trim() && !sending;

  return (
    <View className="flex-row items-end gap-1.5 border-t border-border px-3 py-2.5">
      <Pressable
        onPress={openAttach}
        disabled={uploading}
        className="h-11 w-9 items-center justify-center"
        accessibilityLabel={t("Chats.attach")}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={colors.mutedForeground} />
        ) : (
          <FontAwesome name="paperclip" size={18} color={colors.mutedForeground} />
        )}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={draft}
        onChangeText={setDraft}
        multiline
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={{ height: Math.max(40, Math.min(120, inputHeight)) }}
        onContentSizeChange={(e) =>
          setInputHeight(e.nativeEvent.contentSize.height + 16)
        }
        className="flex-1 rounded-2xl border border-border bg-background px-4 py-2 text-base text-foreground"
      />
      <Pressable
        onPress={() => inputRef.current?.focus()}
        className="h-11 w-9 items-center justify-center"
        accessibilityLabel={t("Chats.emoji")}
      >
        <FontAwesome name="smile-o" size={20} color={colors.mutedForeground} />
      </Pressable>
      <Pressable
        onPress={() => void handleSend()}
        disabled={!canSend}
        className={`h-11 w-11 items-center justify-center rounded-full ${
          canSend ? "bg-primary" : "bg-muted"
        }`}
        accessibilityLabel={t("Chats.send")}
      >
        <FontAwesome
          name="send"
          size={16}
          color={canSend ? colors.primaryForeground : colors.mutedForeground}
        />
      </Pressable>
    </View>
  );
}
