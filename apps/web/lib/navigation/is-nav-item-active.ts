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
 * - A page that has its own menu item but lives below another item's URL
 *   (`/admin/class-budgets/manage` below `/admin/class-budgets`) only
 *   highlights its own item, never the parent as well.
 */

/**
 * Paths that are the parent of the whole section rather than a page among
 * peers. Matched after the locale segment is stripped.
 */
const SECTION_ROOTS = ["/admin"];

/**
 * Menu items whose URL lies below another menu item's URL. On these pages
 * the parent item stays unhighlighted.
 */
const NESTED_NAV_ITEMS = [
  "/admin/class-budgets/manage",
  "/admin/class-budgets/categories",
];

// "/de/admin" -> "/admin"; a locale is always the first segment.
const stripLocale = (path: string): string => path.replace(/^\/[^/]+/, "");

const isSectionRoot = (target: string): boolean =>
  SECTION_ROOTS.includes(stripLocale(target));

const isWithin = (path: string, base: string): boolean =>
  path === base || path.startsWith(base + "/");

/** True when the page belongs to a nested menu item other than `target`. */
const belongsToNestedItem = (pathname: string, target: string): boolean => {
  const page = stripLocale(pathname);
  const item = stripLocale(target);
  return NESTED_NAV_ITEMS.some(
    (nested) =>
      isWithin(page, nested) && nested !== item && isWithin(nested, item),
  );
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
  if (belongsToNestedItem(normalized, target)) return false;
  if (normalized.startsWith(target + "/")) return true;
  return false;
}
