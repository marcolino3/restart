"use client";

import { FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/constants/api-url";
import type { ThreadMessage } from "./MessageThread";

type Attachment = NonNullable<ThreadMessage["attachments"]>[number];

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  attachments: Attachment[];
  mine: boolean;
}

/**
 * Renders a message's attachments as download chips. Images link to the
 * authenticated /api/chat-attachments/:id endpoint (rendered inline by the
 * browser); other files download. Styled to sit inside either bubble colour.
 */
export function MessageAttachments({ attachments, mine }: Props) {
  if (attachments.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {attachments.map((att) => {
        const isImage = att.mimeType.startsWith("image/");
        return (
          <a
            key={att.id}
            href={`${API_URL}/chat-attachments/${att.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition",
              mine
                ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
                : "bg-background/70 text-foreground hover:bg-background",
            )}
          >
            {isImage ? (
              <ImageIcon className="h-4 w-4 shrink-0" />
            ) : (
              <FileText className="h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate">{att.originalName}</span>
            <span className="shrink-0 opacity-70">
              {humanSize(att.sizeBytes)}
            </span>
          </a>
        );
      })}
    </div>
  );
}
