"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ConversationType } from "@restart/shared-types/graphql";
import { getContactsAction } from "../actions/get-contacts.action";
import { createConversationAction } from "../actions/create-conversation.action";
import { initials } from "../lib/chat-display";

type Contact = { id: string; name: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversationId: string) => void;
}

export function NewChatDialog({ open, onOpenChange, onCreated }: Props) {
  const t = useTranslations("Chats");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setGroupName("");
    setQuery("");
    setLoading(true);
    void getContactsAction().then((res) => {
      if (res.success) {
        setContacts(
          res.data.map((m) => ({
            id: m.id,
            name:
              [m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ") ||
              t("formerMember"),
          })),
        );
      } else {
        toast.error(res.error);
      }
      setLoading(false);
    });
  }, [open, t]);

  const filtered = useMemo(
    () =>
      contacts.filter((c) =>
        c.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [contacts, query],
  );

  const isGroup = selected.length > 1;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleCreate = async () => {
    if (selected.length === 0 || submitting) return;
    if (isGroup && !groupName.trim()) {
      toast.error(t("groupNameLabel"));
      return;
    }
    setSubmitting(true);
    const res = await createConversationAction({
      type: isGroup ? ConversationType.Group : ConversationType.Direct,
      name: isGroup ? groupName.trim() : null,
      participantMembershipIds: selected,
    });
    setSubmitting(false);
    if (!res.success) {
      toast.error(res.error ?? t("createError"));
      return;
    }
    onOpenChange(false);
    onCreated(res.data.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isGroup ? t("newGroupTitle") : t("newDirectTitle")}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {isGroup ? (
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t("groupNamePlaceholder")}
            />
          ) : null}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-64 rounded-md border border-border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {t("emptyListTitle")}
              </p>
            ) : (
              <ul className="p-1">
                {filtered.map((c) => {
                  const active = selected.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => toggle(c.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition",
                          active ? "bg-muted" : "hover:bg-muted/60",
                        )}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {initials(c.name)}
                        </span>
                        <span className="flex-1 text-sm">{c.name}</span>
                        {active ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={selected.length === 0 || submitting}
          >
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
