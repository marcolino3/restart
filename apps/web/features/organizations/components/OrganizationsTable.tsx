"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { ROUTES } from "@/constants/routes";
import { GetOrganizationsQuery } from "@restart/shared-types/graphql";
import { removeOrganizationAction } from "../actions/remove-organization.action";

interface Props {
  data: GetOrganizationsQuery["organizations"];
}

type OrganizationRow = GetOrganizationsQuery["organizations"][number];

const useColumns = (): ColumnDef<OrganizationRow>[] => {
  const t = useTranslations("Common");
  const locale = useLocale();

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label={t("selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("name")} />
      ),
      meta: { labelKey: "name" },
      cell: ({ row }) => (
        <div>
          {row.getValue("name") || (
            <span className="text-muted-foreground italic">{t("noName")}</span>
          )}
        </div>
      ),
      filterFn: "includesString",
    },
    {
      id: "subdomain",
      accessorKey: "subdomain",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("subdomain")} />
      ),
      meta: { labelKey: "subdomain" },
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("subdomain") || "–"}
        </div>
      ),
    },
    {
      id: "domain",
      accessorKey: "domain",
      header: t("domain"),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("domain") || "–"}
        </div>
      ),
    },
    {
      id: "isActive",
      accessorKey: "isActive",
      header: t("isActive"),
      filterFn: (row, id, value) => {
        const picks = value as string[] | undefined;
        if (!picks?.length) return true;
        return picks.includes(String(row.getValue<boolean>(id)));
      },
      cell: ({ row }) => {
        const value = row.getValue("isActive") as boolean;
        return value ? (
          <Badge variant="green">{t("active")}</Badge>
        ) : (
          <Badge variant="slate">{t("inactive")}</Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const data = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("openMenu")}</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={ROUTES.admin.organizationsEdit(locale, data.id)}
                  className="flex gap-2"
                >
                  <Pencil className="h-4 w-4" /> {t("edit")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteConfirmationDialog
                itemName={data.name || data.id}
                onConfirm={() => removeOrganizationAction(data.id)}
                trigger={
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="flex gap-2 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> {t("delete")}
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};

export const OrganizationsTable = ({ data }: Props) => {
  const t = useTranslations("Common");
  const columns = useColumns();

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    getRowId: (row) => row.id,
    initialPageSize: 10,
  });

  const filterGroups: FilterGroup[] = React.useMemo(
    () => [
      {
        id: "isActive",
        label: t("status"),
        options: [
          { value: "true", label: t("active") },
          { value: "false", label: t("inactive") },
        ],
      },
    ],
    [t],
  );

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleBulkDelete = async () => {
    const ids = selectedRows.map((row) => row.original.id);

    let errorCount = 0;
    for (const id of ids) {
      const result = await removeOrganizationAction(id);
      if (!result.success) errorCount++;
    }

    table.resetRowSelection();

    return errorCount === 0
      ? { success: true as const }
      : { success: false as const, error: t("deleteError") };
  };

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={t("searchName")}
      filterGroups={filterGroups}
      translateColumn={(key) => t(key)}
      toolbar={
        // Bulk-delete only shows once rows are selected, sitting alongside the
        // filter dropdown rather than in a separate row like the old table.
        selectedCount > 0 ? (
          <DeleteConfirmationDialog
            itemName={`${selectedCount} ${t("selected")}`}
            onConfirm={handleBulkDelete}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                {t("deleteSelected")} ({selectedCount})
              </Button>
            }
          />
        ) : undefined
      }
    />
  );
};
