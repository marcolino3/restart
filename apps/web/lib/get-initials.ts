/**
 * Initials shown in avatar fallbacks (students, employees). Falls back to "?"
 * when neither name part is set.
 */
export function getInitials(firstName?: string | null, lastName?: string | null) {
  return (
    (firstName?.charAt(0)?.toUpperCase() ?? "") +
      (lastName?.charAt(0)?.toUpperCase() ?? "") || "?"
  );
}
