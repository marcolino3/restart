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
 * - Section roots (`/de/admin`) are the exception: every other item lives
 *   below them, so the subpath rule would keep the dashboard highlighted on
 *   every page. They only match exactly.
 */

/**
 * Paths that are the parent of the whole section rather than a page among
 * peers. Matched after the locale segment is stripped.
 */
const SECTION_ROOTS = ["/admin"];

const isSectionRoot = (target: string): boolean => {
  // "/de/admin" -> "/admin"; a locale is always the first segment.
  const withoutLocale = target.replace(/^\/[^/]+/, "");
  return SECTION_ROOTS.includes(withoutLocale);
};

export function isNavItemActive(
  pathname: string | null,
  itemUrl: string,
): boolean {
  if (!pathname || !itemUrl) return false;
  if (itemUrl === "#") return false;

  const normalized = pathname.replace(/\/+$/, "");
  const target = itemUrl.replace(/\/+$/, "");

  if (normalized === target) return true;
  if (isSectionRoot(target)) return false;
  if (normalized.startsWith(target + "/")) return true;
  return false;
}
