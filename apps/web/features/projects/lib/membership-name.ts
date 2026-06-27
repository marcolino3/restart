import type { MembershipRef } from "../types";

/** Human-readable label for a membership: full name, else e-mail, else id. */
export function membershipName(membership?: MembershipRef | null): string {
  if (!membership) return "—";
  const first = membership.user?.firstName?.trim() ?? "";
  const last = membership.user?.lastName?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return membership.userEmail?.email ?? membership.id;
}

/** Up-to-two-letter initials for an avatar fallback. */
export function membershipInitials(membership?: MembershipRef | null): string {
  const name = membershipName(membership);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
