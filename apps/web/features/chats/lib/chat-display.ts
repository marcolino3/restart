import type { MyConversationsQuery } from "@restart/shared-types/graphql";

export type ConversationListItem = MyConversationsQuery["myConversations"][number];
export type Conversation = ConversationListItem["conversation"];
export type Participant = NonNullable<Conversation["participants"]>[number];

/** Full name of a participant's user, or a fallback for former members. */
export function participantName(
  participant: Participant | undefined,
  fallback: string,
): string {
  const user = participant?.membership?.user;
  if (!user) return fallback;
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || fallback;
}

/** Full name from a message sender's user relation, or a fallback. */
export function senderName(
  sender:
    | { user?: { firstName: string; lastName: string } | null }
    | null
    | undefined,
  fallback: string,
): string {
  const user = sender?.user;
  if (!user) return fallback;
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || fallback;
}

/** Two-letter initials for an avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Display title for a conversation: the group/team name, or — for direct
 * chats — the other participant's name. `selfMembershipId` identifies the
 * viewer so we pick the *other* person.
 */
export function conversationTitle(
  conversation: Conversation,
  selfMembershipId: string,
  fallbacks: { direct: string; group: string; team: string },
): string {
  if (conversation.type === "GROUP") return conversation.name ?? fallbacks.group;
  if (conversation.type === "TEAM")
    return conversation.team?.name ?? conversation.name ?? fallbacks.team;
  const other = conversation.participants?.find(
    (p) => p.membershipId !== selfMembershipId,
  );
  return participantName(other, fallbacks.direct);
}

/** Locale-aware clock time, e.g. "09:42". */
export function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Date-divider label: Today / Yesterday / locale date. */
export function dayLabel(
  iso: string,
  locale: string,
  labels: { today: string; yesterday: string },
): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return labels.today;
  if (diffDays === 1) return labels.yesterday;
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
