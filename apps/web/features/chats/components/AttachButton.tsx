"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/constants/api-url";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/gif";

interface Props {
  conversationId: string;
  onAttached: () => void;
}

/**
 * Attachment clip in the composer. Uploads the picked file to the authenticated
 * /api/chat-attachments endpoint, which creates a message carrying the
 * attachment and publishes it over the messageAdded subscription — so it
 * arrives in realtime like any other message. onAttached refreshes the thread.
 */
export function AttachButton({ conversationId, onAttached }: Props) {
  const t = useTranslations("Chats");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `${API_URL}/chat-attachments?conversationId=${conversationId}`,
        { method: "POST", body: fd, credentials: "include" },
      );
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        toast.error(result?.message ?? t("attachError"));
        return;
      }
      onAttached();
    } catch {
      toast.error(t("attachError"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="shrink-0 text-muted-foreground"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        aria-label={t("attach")}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}
