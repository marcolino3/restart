"use client";

import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
} from "@tanstack/react-table";
import { useLocale } from "next-intl";
import * as React from "react";

import {
  activeSortLocale,
  localeSortFn,
  normalizeForSearch,
} from "@/lib/table/locale-sorting";

/**
 * Shared feature set for every table in the app. Every `DataTable*` component
 * and column-def type is generic over `AppTableFeatures` instead of each
 * table declaring its own subset, since call sites all rely on the same
 * sorting/filtering/visibility/selection/pagination/faceting surface.
 */
export const appTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  globalFilteringFeature,
  rowSelectionFeature,
  rowSortingFeature,
  rowPaginationFeature,
  columnFacetingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  // Applies to every column that doesn't set its own `sortFn`, so tables get
  // locale-correct ordering without opting in per column. Must be a stable
  // reference (registered once here, not per `useTable()` call) — it reads
  // the active locale from `activeSortLocale` instead of closing over it.
  sortFns: { auto: localeSortFn },
});

export type AppTableFeatures = typeof appTableFeatures;

export interface UseDataTableOptions<TData extends Record<string, unknown>>
  extends Omit<
    TableOptions<AppTableFeatures, TData>,
    "features" | "state" | "columns" | "data"
  > {
  data: TData[];
  columns: ColumnDef<AppTableFeatures, TData, unknown>[];
  /** Disables the pagination row model (renders every row). */
  paginated?: boolean;
  initialPageSize?: number;
  initialSorting?: SortingState;
  initialVisibility?: ColumnVisibilityState;
  /** Enables the built-in search box wiring. */
  enableGlobalFilter?: boolean;
}

/**
 * Shared TanStack setup for every table in the app.
 *
 * Two things it centralises beyond the boilerplate:
 * - **Locale-aware sorting.** Text columns default to an `Intl.Collator`
 *   comparison, so umlauts sort next to their base letter instead of after
 *   `z` (see `lib/table/locale-sorting.ts`).
 * - **Diacritic-insensitive global search**, so "Muller" matches "Müller".
 */
/** Sentinel page size that keeps every row on a single page when `paginated` is off. */
const ALL_ROWS = Number.MAX_SAFE_INTEGER;

export function useDataTable<TData extends Record<string, unknown>>({
  data,
  columns,
  paginated = true,
  initialPageSize = 25,
  initialSorting = [],
  initialVisibility = {},
  enableGlobalFilter = true,
  ...options
}: UseDataTableOptions<TData>) {
  const locale = useLocale();
  activeSortLocale.current = locale;

  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>(initialVisibility);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: paginated ? initialPageSize : ALL_ROWS,
  });

  const table = useTable<AppTableFeatures, TData>({
    features: appTableFeatures,
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      ...(enableGlobalFilter ? { globalFilter } : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    // Searches every visible cell, ignoring case and diacritics.
    globalFilterFn: (row, _columnId, filterValue) => {
      const needle = normalizeForSearch(filterValue);
      if (!needle) return true;

      return row
        .getVisibleCells()
        .some((cell) =>
          normalizeForSearch(cell.getValue()).includes(needle),
        );
    },
    ...options,
  });

  // Jumping back to page 1 keeps a narrowed result set from landing the user
  // on a now-empty page.
  React.useEffect(() => {
    table.setPageIndex(0);
  }, [globalFilter, columnFilters, table]);

  return {
    table,
    globalFilter,
    setGlobalFilter,
    sorting,
    columnFilters,
    rowSelection,
  };
}
