"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTime } from "../lib/chat-display";
import { MessageAttachments } from "./MessageAttachments";
import type { ThreadMessage } from "./MessageThread";

interface Props {
  message: ThreadMessage;
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

/** The current user's own message: bubble on the right with an edit/delete
 *  hover menu and inline editing. Shows a "bearbeitet" marker after an edit. */
export function OwnMessageBubble({ message, onEdit, onDelete }: Props) {
  const t = useTranslations("Chats");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const attachments = message.attachments ?? [];

  const submitEdit = async () => {
    const body = draft.trim();
    if (body && body !== message.body) await onEdit(message.id, body);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex w-full max-w-[78%] items-center gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submitEdit();
              }
              if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 rounded-full"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => void submitEdit()}
            aria-label={t("save")}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              setDraft(message.body);
              setEditing(false);
            }}
            aria-label={t("cancel")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1">
        {/* Hover menu — sits left of the bubble for own messages */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100"
              aria-label={t("messageActions")}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void onDelete(message.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex max-w-full flex-col gap-1.5 rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
          {message.body ? <span>{message.body}</span> : null}
          <MessageAttachments attachments={attachments} mine />
        </div>
      </div>
      <span className="px-1 text-[10px] text-muted-foreground">
        {formatTime(message.createdAt, locale)}
        {message.editedAt ? ` · ${t("edited")}` : ""}
      </span>
    </div>
  );
}
