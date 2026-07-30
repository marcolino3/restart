"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Send, Users } from "lucide-react";
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
import { EmojiPicker } from "./EmojiPicker";
import { AttachButton } from "./AttachButton";
import { MessageAttachments } from "./MessageAttachments";
import { OwnMessageBubble } from "./OwnMessageBubble";

export type ThreadMessage =
  ConversationMessagesQuery["conversationMessages"][number];

interface Props {
  conversation: Conversation | null;
  messages: ThreadMessage[];
  selfMembershipId: string;
  onSend: (body: string) => Promise<void>;
  onAttached: () => void;
  hasMore: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => Promise<number>;
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

export function MessageThread({
  conversation,
  messages,
  selfMembershipId,
  onSend,
  onAttached,
  hasMore,
  loadingOlder,
  onLoadOlder,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations("Chats");
  const locale = useLocale();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationId = conversation?.id;

  // Pin to the bottom: jump instantly when switching conversation, and follow
  // new messages only when the user is already near the bottom (so reading
  // older messages isn't interrupted by an incoming one).
  const lastCount = useRef(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const switched = conversationId !== undefined;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    const grew = messages.length > lastCount.current;
    if (switched && lastCount.current === 0) {
      el.scrollTop = el.scrollHeight; // initial load → bottom, no animation
    } else if (grew && nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    lastCount.current = messages.length;
  }, [messages.length, conversationId]);

  // Reset the counter when the conversation changes so the next load jumps to
  // the bottom instead of animating.
  useEffect(() => {
    lastCount.current = 0;
  }, [conversationId]);

  // Load older messages while preserving the visual scroll position: capture
  // the distance from the bottom before prepending, restore it after, so the
  // viewport stays on the same message instead of jumping to the top.
  const handleLoadOlder = async () => {
    const el = scrollRef.current;
    const beforeBottom = el ? el.scrollHeight - el.scrollTop : 0;
    const added = await onLoadOlder();
    if (added > 0 && el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - beforeBottom;
      });
      // The prepend increased the count; don't let the bottom-pin effect fire.
      lastCount.current += added;
    }
  };

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

      {/* Messages — native scroll container pinned to the bottom (mt-auto):
          few messages sit at the bottom on the white surface like a real chat
          app, many scroll normally with the newest at the bottom. */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5">
        <div className="flex min-h-full flex-col justify-end gap-4 py-4">
          {hasMore ? (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleLoadOlder()}
                disabled={loadingOlder}
                className="text-xs text-muted-foreground"
              >
                {loadingOlder ? t("loadingOlder") : t("loadOlder")}
              </Button>
            </div>
          ) : null}
          {grouped.map((group) => (
            <div key={group.day} className="flex flex-col gap-3">
              <div className="flex justify-center">
                <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {group.day}
                </span>
              </div>
              {group.items.map((m, i) => {
                const mine = m.senderMembershipId === selfMembershipId;
                const author = senderName(m.sender, t("formerMember"));
                // Only show the sender's name/avatar at the start of a run of
                // messages from the same sender (like the design template).
                const prev = group.items[i - 1];
                const startsRun =
                  !prev || prev.senderMembershipId !== m.senderMembershipId;
                const attachments = m.attachments ?? [];
                if (mine) {
                  return (
                    <OwnMessageBubble
                      key={m.id}
                      message={m}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  );
                }
                return (
                  <div key={m.id} className="flex items-end gap-2">
                    {/* Avatar column — only under the first message of a run */}
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary",
                        startsRun ? "" : "invisible",
                      )}
                      aria-hidden
                    >
                      {initials(author)}
                    </span>
                    <div className="flex max-w-[78%] flex-col items-start gap-0.5">
                      {startsRun ? (
                        <span className="px-1 text-[11px] font-semibold text-primary">
                          {author}
                        </span>
                      ) : null}
                      <div className="flex flex-col gap-1.5 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2 text-sm text-foreground">
                        {m.body ? <span>{m.body}</span> : null}
                        <MessageAttachments
                          attachments={attachments}
                          mine={false}
                        />
                      </div>
                      <span className="px-1 text-[10px] text-muted-foreground">
                        {formatTime(m.createdAt, locale)}
                        {m.editedAt ? ` · ${t("edited")}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Composer: attachment clip (left), input, emoji + send (right) — as in
          the design template. */}
      <div className="flex items-center gap-1.5 border-t border-border px-3 py-2.5">
        <AttachButton conversationId={conversation.id} onAttached={onAttached} />
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
          className="flex-1 rounded-full"
        />
        <EmojiPicker onSelect={(emoji) => setDraft((d) => d + emoji)} />
        <Button
          size="icon"
          className="shrink-0 rounded-full"
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
