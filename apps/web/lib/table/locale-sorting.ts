import type { Row, SortingFn } from "@tanstack/react-table";

// NB: deliberately no `declare module "@tanstack/react-table"` augmentation
// here. Registering named sorting/filter fns makes them part of every
// `TableOptions` in the project, so all remaining hand-rolled
// `useReactTable()` calls would fail to typecheck until they are migrated.
// Columns pass `createLocaleSortingFn(locale)` / `localeIncludesFilter` by
// reference instead — see `useDataTable`, which applies the locale sorter to
// every text column by default.

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
 * Builds a locale-aware `sortingFn` for text columns.
 *
 * Empty values always sort last regardless of direction, so rows with missing
 * data do not push real content off the first page.
 */
export function createLocaleSortingFn<TData>(
  locale: string,
): SortingFn<TData> {
  const collator = getCollator(locale);

  return (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
    const a = toComparableString(rowA.getValue(columnId)).trim();
    const b = toComparableString(rowB.getValue(columnId)).trim();

    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    return collator.compare(a, b);
  };
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
 */
export function localeIncludesFilter<TData>(
  row: Row<TData>,
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
export function multiSelectFilter<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown,
): boolean {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;

  return filterValue.includes(row.getValue(columnId));
}
