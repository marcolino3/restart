/**
 * Determines whether a sidebar/menu item should be highlighted as active for
 * the current pathname.
 *
 * Rules:
 * - Placeholder URLs like "#" never match.
 * - Exact match counts as active.
 * - Subpaths count as active (e.g. `/de/admin/curricula/edit/abc` keeps
 *   `/de/admin/curricula` highlighted) — but only when the next character is
 *   a `/`, so `/de/admin/curricula-other` does NOT match `/de/admin/curricula`.
 */
export function isNavItemActive(
  pathname: string | null,
  itemUrl: string,
): boolean {
  if (!pathname || !itemUrl) return false;
  if (itemUrl === "#") return false;

  const normalized = pathname.replace(/\/+$/, "");
  const target = itemUrl.replace(/\/+$/, "");

  if (normalized === target) return true;
  if (normalized.startsWith(target + "/")) return true;
  return false;
}
