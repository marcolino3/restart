"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

/**
 * Sortable column header. Replaces the sort button that used to be
 * copy-pasted into every table's `ColumnDef`.
 *
 * Cycles ascending -> descending -> unsorted, and exposes the current state
 * via `aria-sort` so the sort order is announced rather than only drawn.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const t = useTranslations("DataTable");

  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  const sorted = column.getIsSorted();
  const nextLabel =
    sorted === "asc"
      ? t("sortDescending")
      : sorted === "desc"
        ? t("clearSort")
        : t("sortAscending");

  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={() => {
        if (sorted === "desc") {
          column.clearSorting();
        } else {
          column.toggleSorting(sorted === "asc");
        }
      }}
      aria-label={`${title}: ${nextLabel}`}
      className={cn(
        "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        sorted && "text-foreground",
        className,
      )}
    >
      <span>{title}</span>
      <Icon
        className={cn("size-3 shrink-0", !sorted && "opacity-50")}
        aria-hidden
      />
    </button>
  );
}
