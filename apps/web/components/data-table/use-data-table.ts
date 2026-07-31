"use client";

import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type VisibilityState,
} from "@tanstack/react-table";
import { useLocale } from "next-intl";
import * as React from "react";

import {
  createLocaleSortingFn,
  normalizeForSearch,
} from "@/lib/table/locale-sorting";

export interface UseDataTableOptions<TData>
  extends Omit<
    TableOptions<TData>,
    "getCoreRowModel" | "state" | "columns" | "data"
  > {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  /** Disables the pagination row model (renders every row). */
  paginated?: boolean;
  initialPageSize?: number;
  initialSorting?: SortingState;
  initialVisibility?: VisibilityState;
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
export function useDataTable<TData>({
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

  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialVisibility);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const localeSortingFn = React.useMemo(
    () => createLocaleSortingFn<TData>(locale),
    [locale],
  );

  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(enableGlobalFilter ? { globalFilter } : {}),
      ...(paginated ? { pagination } : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    ...(paginated ? { getPaginationRowModel: getPaginationRowModel() } : {}),
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
    // Applies to every column that doesn't set its own `sortingFn`, so tables
    // get locale-correct ordering without opting in per column.
    sortingFns: { auto: localeSortingFn },
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
