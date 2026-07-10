import { t } from "@/lib/i18n";
import type {
  ChatConversation,
  ChatParticipant,
  ChatMessage,
} from "./chats-api";

export function userName(
  user: { firstName: string; lastName: string } | null | undefined,
  fallback: string,
): string {
  if (!user) return fallback;
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || fallback;
}

export function participantName(
  participant: ChatParticipant | undefined,
  fallback: string,
): string {
  return userName(participant?.membership?.user, fallback);
}

export function senderName(message: ChatMessage, fallback: string): string {
  return userName(message.sender?.user, fallback);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function conversationTitle(
  conversation: ChatConversation,
  selfMembershipId: string,
): string {
  if (conversation.type === "GROUP")
    return conversation.name ?? t("Chats.typeGroup");
  if (conversation.type === "TEAM")
    return conversation.team?.name ?? conversation.name ?? t("Chats.typeTeam");
  const other = conversation.participants?.find(
    (p) => p.membershipId !== selfMembershipId,
  );
  return participantName(other, t("Chats.formerMember"));
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return t("Chats.today");
  if (diffDays === 1) return t("Chats.yesterday");
  return d.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
