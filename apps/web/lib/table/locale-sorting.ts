import type { FilterFn, Row, TableFeatures } from "@tanstack/react-table";

// `sortFns` must be registered once, statically, in `tableFeatures()` (see
// `AppTableFeatures` in `components/data-table/use-data-table.ts`) — it can't
// take a per-render closure. `localeSortFn` stays a stable reference and
// reads the active locale from `activeSortLocale` instead.

/**
 * Locale-aware table sorting and filtering.
 *
 * TanStack's built-in `alphanumeric` sorting compares strings with `<`/`>`,
 * which uses UTF-16 code points. In German that is visibly wrong: "Öztürk"
 * sorts after "Zürcher" and "Ärztin" after "Zahn", because the umlaut
 * characters live above `z` in the code point table. Every text column must go
 * through an `Intl.Collator` instead.
 */

/** Collators are expensive to build, so keep one per locale. */
const collators = new Map<string, Intl.Collator>();

export function getCollator(locale: string): Intl.Collator {
  let collator = collators.get(locale);

  if (!collator) {
    collator = new Intl.Collator(locale, {
      // Treat "Muller"/"muller"/"Müller" as equal for ordering purposes, so
      // case and accents never outrank the actual alphabetical order.
      sensitivity: "base",
      // "Klasse 2" before "Klasse 10" instead of lexicographic "10" < "2".
      numeric: true,
    });
    collators.set(locale, collator);
  }

  return collator;
}

/** Normalises a cell value to a comparable/searchable string. */
function toComparableString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Current locale for {@link localeSortFn}. `sortFns` must be registered once
 * in the static `tableFeatures()` call (see `AppTableFeatures`), so the fn
 * reference itself must stay stable — it reads the active locale from this
 * ref instead of closing over one. `useDataTable` updates it on every render.
 */
export const activeSortLocale = { current: "de-CH" };

function compareLocaleStrings(a: string, b: string): number {
  return getCollator(activeSortLocale.current).compare(a, b);
}

/**
 * Locale-aware `sortFn` for text columns, registered once as `auto` in
 * `AppTableFeatures`.
 *
 * Empty values always sort last regardless of direction, so rows with missing
 * data do not push real content off the first page.
 */
export function localeSortFn<
  TFeatures extends TableFeatures,
  TData extends Record<string, unknown>,
>(
  rowA: Row<TFeatures, TData>,
  rowB: Row<TFeatures, TData>,
  columnId: string,
): number {
  const a = toComparableString(rowA.getValue(columnId)).trim();
  const b = toComparableString(rowB.getValue(columnId)).trim();

  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  return compareLocaleStrings(a, b);
}

/**
 * Strips diacritics so a search for "Muller" also matches "Müller" and
 * "Oztuerk" does not silently miss "Öztürk".
 */
export function normalizeForSearch(value: unknown): string {
  return toComparableString(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Diacritic-insensitive substring filter, usable as a column or global
 * `filterFn`.
 *
 * A plain function generic over `TFeatures`/`TData` (not a `FilterFn`-typed
 * const), because `FilterFn`'s type parameters are invariant — a const fixed
 * to `TableFeatures`/`Record<string, unknown>` would not be assignable to a
 * `ColumnDef`'s `filterFn` for any concrete app row type.
 */
export function localeIncludesFilter<
  TFeatures extends TableFeatures,
  TData extends Record<string, unknown>,
>(
  row: Parameters<FilterFn<TFeatures, TData>>[0],
  columnId: string,
  filterValue: unknown,
): boolean {
  const needle = normalizeForSearch(filterValue);
  if (!needle) return true;

  return normalizeForSearch(row.getValue(columnId)).includes(needle);
}

/**
 * Multi-select filter for scalar columns (faceted filters hand over an array
 * of accepted values). An empty selection means "no filter".
 */
export function multiSelectFilter<
  TFeatures extends TableFeatures,
  TData extends Record<string, unknown>,
>(
  row: Parameters<FilterFn<TFeatures, TData>>[0],
  columnId: string,
  filterValue: unknown,
): boolean {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;

  return filterValue.includes(row.getValue(columnId));
}
