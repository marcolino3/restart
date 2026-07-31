"use client";

import type { Column, Table } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Column metadata a `ColumnDef` can carry so the shared table chrome knows how
 * to label a column outside of its header cell.
 */
export interface DataTableColumnMeta {
  /** Translation key for the column label, resolved in the table's namespace. */
  labelKey?: string;
  /** Plain label, used when the column has no `labelKey`. */
  label?: string;
  /** Hides the column from the visibility menu. */
  hideFromViewOptions?: boolean;
}

/**
 * Resolves a human-readable column label.
 *
 * Without this, the visibility menu falls back to `column.id` and shows raw
 * field names like "firstName" — untranslated, in every language.
 */
export function resolveColumnLabel<TData>(
  column: Column<TData, unknown>,
  translate: (key: string) => string,
): string {
  const meta = column.columnDef.meta as DataTableColumnMeta | undefined;

  if (meta?.labelKey) return translate(meta.labelKey);
  if (meta?.label) return meta.label;

  return column.id;
}

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  /** Resolves a column's `labelKey` in the calling feature's namespace. */
  translateColumn?: (key: string) => string;
}

export function DataTableViewOptions<TData>({
  table,
  translateColumn,
}: DataTableViewOptionsProps<TData>) {
  const t = useTranslations("DataTable");
  const translate = translateColumn ?? ((key: string) => key);

  const columns = table
    .getAllColumns()
    .filter((column) => column.getCanHide())
    .filter(
      (column) =>
        !(column.columnDef.meta as DataTableColumnMeta | undefined)
          ?.hideFromViewOptions,
    );

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="size-3.5" />
          {t("columns")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("toggleColumns")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {resolveColumnLabel(column, translate)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
