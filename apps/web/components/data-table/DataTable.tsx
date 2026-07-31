"use client";

import { flexRender, type Row, type Table as TanStackTable } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { SearchInput } from "@/components/common/SearchInput";
import { TableCard } from "@/components/common/TableCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { DataTableActiveFilters } from "./DataTableActiveFilters";
import { DataTableFilter, type FilterGroup } from "./DataTableFilter";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableViewOptions } from "./DataTableViewOptions";

/**
 * Columns whose cells own their click handling. With `onRowClick` set, a click
 * inside these must not bubble up into the row navigation — otherwise opening
 * the actions menu or ticking a checkbox also navigates away.
 */
const INTERACTIVE_COLUMN_IDS = new Set(["select", "actions"]);

interface DataTableProps<TData> {
  table: TanStackTable<TData>;
  /** Search box value. Omit both search props to hide the search box. */
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  /**
   * Filter groups for the single filter dropdown. Selections are written
   * straight back to the matching column filters.
   */
  filterGroups?: FilterGroup[];
  /** Extra toolbar content rendered after the filter button. */
  toolbar?: React.ReactNode;
  /** Resolves `meta.labelKey` for the column visibility menu. */
  translateColumn?: (key: string) => string;
  showViewOptions?: boolean;
  showPagination?: boolean;
  isLoading?: boolean;
  /** Rendered in place of the "no results" default. */
  emptyState?: React.ReactNode;
  onRowClick?: (row: Row<TData>) => void;
  className?: string;
}

/**
 * The app's single table shell: search + filters toolbar, the table itself in
 * a white card (`.tbl` from the design handoff) and pagination underneath.
 *
 * All chrome strings ("no results", "rows per page", …) come from the shared
 * `DataTable` namespace, so call sites never pass them in — that is what kept
 * the previous copy-pasted tables drifting apart between DE and EN.
 */
export function DataTable<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder,
  filterGroups,
  toolbar,
  translateColumn,
  showViewOptions = true,
  showPagination = true,
  isLoading = false,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const t = useTranslations("DataTable");

  const columnCount = table.getVisibleFlatColumns().length;
  const rows = table.getRowModel().rows;
  const hasSearch = onGlobalFilterChange !== undefined;
  const hasFilters = Boolean(filterGroups?.length);
  const hasToolbar =
    hasSearch || hasFilters || Boolean(toolbar) || showViewOptions;

  // The filter popover reads and writes TanStack's column filters directly, so
  // call sites don't have to mirror the selection in their own state.
  //
  // Derived from `columnFilters` state rather than `table.getColumn(...)`:
  // the table instance is referentially stable, so a memo keyed on it would
  // never recompute and the checkboxes would never tick.
  const columnFilters = table.getState().columnFilters;
  const filterValue = React.useMemo(() => {
    const selection: Record<string, string[]> = {};

    for (const group of filterGroups ?? []) {
      const raw = columnFilters.find((f) => f.id === group.id)?.value;
      if (Array.isArray(raw) && raw.length > 0) {
        selection[group.id] = raw as string[];
      }
    }

    return selection;
  }, [filterGroups, columnFilters]);

  function handleFilterChange(next: Record<string, string[]>) {
    for (const group of filterGroups ?? []) {
      const selected = next[group.id] ?? [];
      table
        .getColumn(group.id)
        ?.setFilterValue(selected.length > 0 ? selected : undefined);
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {hasToolbar && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {hasSearch && (
            <SearchInput
              value={globalFilter ?? ""}
              onValueChange={onGlobalFilterChange}
              placeholder={searchPlaceholder}
            />
          )}
          {hasFilters && (
            <>
              <DataTableFilter
                groups={filterGroups ?? []}
                value={filterValue}
                onChange={handleFilterChange}
              />
              <DataTableActiveFilters
                groups={filterGroups ?? []}
                value={filterValue}
                onChange={handleFilterChange}
              />
            </>
          )}
          {toolbar}
          {showViewOptions && (
            <div className="ml-auto">
              <DataTableViewOptions
                table={table}
                translateColumn={translateColumn}
              />
            </div>
          )}
        </div>
      )}

      <TableCard>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {Array.from({ length: columnCount }).map((__, cellIndex) => (
                    <TableCell key={`skeleton-cell-${cellIndex}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="h-32 text-center">
                  {emptyState ?? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[13.5px] font-medium">
                        {t("noResults")}
                      </span>
                      <span className="text-[12.5px] text-muted-foreground">
                        {t("noResultsHint")}
                      </span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      // Interactive cells (row actions, selection checkboxes)
                      // must not also trigger the row's navigation.
                      onClick={
                        onRowClick && INTERACTIVE_COLUMN_IDS.has(cell.column.id)
                          ? (event) => event.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>

      {showPagination && !isLoading && rows.length > 0 && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}
