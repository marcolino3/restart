"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Send, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConversationMessagesQuery } from "@restart/shared-types/graphql";
import {
  type Conversation,
  conversationTitle,
  participantName,
  senderName,
  initials,
  formatTime,
  dayLabel,
} from "../lib/chat-display";

export type ThreadMessage =
  ConversationMessagesQuery["conversationMessages"][number];

interface Props {
  conversation: Conversation | null;
  messages: ThreadMessage[];
  selfMembershipId: string;
  onSend: (body: string) => Promise<void>;
}

export function MessageThread({
  conversation,
  messages,
  selfMembershipId,
  onSend,
}: Props) {
  const t = useTranslations("Chats");
  const locale = useLocale();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const fallbacks = {
    direct: t("formerMember"),
    group: t("typeGroup"),
    team: t("typeTeam"),
  };

  const title = conversation
    ? conversationTitle(conversation, selfMembershipId, fallbacks)
    : "";

  const memberLine = useMemo(() => {
    if (!conversation) return "";
    const names = (conversation.participants ?? [])
      .map((p) => participantName(p, t("formerMember")))
      .slice(0, 3)
      .join(", ");
    const count = conversation.participants?.length ?? 0;
    return `${names} · ${t("membersCount", { count })}`;
  }, [conversation, t]);

  // Group messages by day for the date dividers.
  const grouped = useMemo(() => {
    const out: { day: string; items: ThreadMessage[] }[] = [];
    for (const m of messages) {
      const day = dayLabel(m.createdAt, locale, {
        today: t("today"),
        yesterday: t("yesterday"),
      });
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, locale]);

  if (!conversation) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 bg-card text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Users className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">{t("emptyThreadTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("emptyThreadHint")}</p>
      </div>
    );
  }

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      await onSend(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden
        >
          {conversation.type === "DIRECT" ? (
            initials(title)
          ) : (
            <Users className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{memberLine}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-5">
        <div className="flex flex-col gap-4 py-4">
          {grouped.map((group) => (
            <div key={group.day} className="flex flex-col gap-3">
              <div className="flex justify-center">
                <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {group.day}
                </span>
              </div>
              {group.items.map((m) => {
                const mine = m.senderMembershipId === selfMembershipId;
                const author = senderName(m.sender, t("formerMember"));
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex max-w-[78%] flex-col gap-1",
                      mine ? "items-end self-end" : "items-start self-start",
                    )}
                  >
                    {!mine ? (
                      <span className="px-1 text-[11px] font-medium text-muted-foreground">
                        {author}
                      </span>
                    ) : null}
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm",
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {m.body}
                    </div>
                    <span className="px-1 text-[10px] text-muted-foreground">
                      {formatTime(m.createdAt, locale)}
                      {m.editedAt ? ` · ${t("edited")}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={t("messagePlaceholder", { name: title })}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={() => void handleSend()}
          disabled={!draft.trim() || sending}
          aria-label={t("send")}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
