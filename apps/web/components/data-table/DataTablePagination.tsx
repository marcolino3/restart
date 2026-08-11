"use client";

import type { ReactTable } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type AppTableFeatures } from "./use-data-table";

/**
 * Sentinel page size for "show all rows". Large enough that TanStack renders
 * a single page, without the `Infinity` that breaks its page-count maths.
 */
const ALL_ROWS = Number.MAX_SAFE_INTEGER;

interface DataTablePaginationProps<TData extends Record<string, unknown>> {
  table: ReactTable<AppTableFeatures, TData>;
  pageSizeOptions?: number[];
  /** Offers an "all rows" entry in the page-size select. */
  allowAll?: boolean;
}

/** Row count, page-size select and page controls — rendered BELOW the table. */
export function DataTablePagination<TData extends Record<string, unknown>>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
  allowAll = true,
}: DataTablePaginationProps<TData>) {
  const t = useTranslations("DataTable");

  const pageCount = table.getPageCount();
  const { pageIndex, pageSize } = table.state.pagination;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-1 pt-4 text-[13px]">
      <div className="text-muted-foreground">
        {selectedCount > 0
          ? t("rowsSelected", { selected: selectedCount, total: totalCount })
          : t("resultCount", { count: totalCount })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-muted-foreground">
            {t("rowsPerPage")}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[88px]">
              <SelectValue>
                {pageSize >= ALL_ROWS ? t("all") : pageSize}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
              {allowAll && (
                <SelectItem value={String(ALL_ROWS)}>{t("all")}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {pageCount > 1 && (
          <>
            <span className="whitespace-nowrap text-muted-foreground">
              {t("pageOf", { page: pageIndex + 1, total: pageCount })}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label={t("firstPage")}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label={t("previousPage")}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label={t("nextPage")}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
                aria-label={t("lastPage")}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
