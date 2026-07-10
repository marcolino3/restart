"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type ConversationListItem,
  conversationTitle,
  initials,
  formatTime,
} from "../lib/chat-display";

type Filter = "all" | "DIRECT" | "GROUP" | "TEAM";

interface Props {
  items: ConversationListItem[];
  selfMembershipId: string;
  activeId: string | null;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
}

export function ConversationList({
  items,
  selfMembershipId,
  activeId,
  onSelect,
  onNewChat,
}: Props) {
  const t = useTranslations("Chats");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const fallbacks = {
    direct: t("formerMember"),
    group: t("typeGroup"),
    team: t("typeTeam"),
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.conversation.type !== filter) return false;
      if (!query.trim()) return true;
      const title = conversationTitle(
        item.conversation,
        selfMembershipId,
        fallbacks,
      );
      return title.toLowerCase().includes(query.trim().toLowerCase());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filter, query, selfMembershipId]);

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "DIRECT", label: t("filterDirect") },
    { key: "GROUP", label: t("filterGroups") },
    { key: "TEAM", label: t("filterTeams") },
  ];

  return (
    <div className="flex h-full w-full flex-col border-r border-border">
      {/* Search + new chat */}
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Button
          size="icon"
          onClick={onNewChat}
          aria-label={t("newChat")}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-3 pb-2">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3 py-1 text-[13px] font-medium transition",
              filter === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
            <p className="text-sm font-medium">{t("emptyListTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("emptyListHint")}</p>
          </div>
        ) : (
          <ul className="px-2 pb-2">
            {filtered.map((item) => {
              const { conversation, lastMessage, unreadCount } = item;
              const title = conversationTitle(
                conversation,
                selfMembershipId,
                fallbacks,
              );
              const isActive = conversation.id === activeId;
              const isGroup =
                conversation.type === "GROUP" || conversation.type === "TEAM";
              return (
                <li key={conversation.id}>
                  <button
                    onClick={() => onSelect(conversation.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition",
                      isActive ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        isGroup
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                      aria-hidden
                    >
                      {isGroup ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        initials(title)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {title}
                        </span>
                        {lastMessage ? (
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatTime(lastMessage.createdAt, locale)}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {lastMessage?.body ?? ""}
                        </span>
                        {unreadCount > 0 ? (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
