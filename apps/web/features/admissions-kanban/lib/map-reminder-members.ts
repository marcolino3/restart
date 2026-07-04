import type { MembershipRef } from "@/features/projects/types";
import type { ReminderMember } from "../components/ReminderForm";

/** Maps org memberships to the `{ id, name }` shape the reminder pickers expect. */
export function mapReminderMembers(
  memberships: MembershipRef[],
): ReminderMember[] {
  return memberships.map((m) => {
    const name = `${m.user?.firstName ?? ""} ${m.user?.lastName ?? ""}`.trim();
    return {
      id: m.id,
      name: name || m.userEmail?.email || m.id,
    };
  });
}
