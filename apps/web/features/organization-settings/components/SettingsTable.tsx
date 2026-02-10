"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrganizationSetting } from "../actions/get-settings.action";
import { getOrganizationSettingValueAction } from "../actions/get-setting-value.action";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: OrganizationSetting[];
  organizationId: string;
  onEdit: (setting: OrganizationSetting) => void;
  onDelete: (setting: OrganizationSetting) => void;
}

export const SettingsTable = ({ data, organizationId, onEdit, onDelete }: Props) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [revealedValues, setRevealedValues] = React.useState<Record<string, string>>({});
  const [loadingKeys, setLoadingKeys] = React.useState<Set<string>>(new Set());

  const toggleReveal = async (key: string) => {
    if (revealedValues[key]) {
      setRevealedValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    setLoadingKeys((prev) => new Set(prev).add(key));

    const result = await getOrganizationSettingValueAction(organizationId, key);

    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    if (result.success && result.data?.value) {
      setRevealedValues((prev) => ({
        ...prev,
        [key]: result.data!.value!,
      }));
    }
  };

  const columns: ColumnDef<OrganizationSetting>[] = [
    {
      accessorKey: "key",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Key
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <code className="bg-muted rounded px-2 py-1 text-sm font-mono">
          {row.getValue("key")}
        </code>
      ),
    },
    {
      id: "value",
      header: "Wert",
      cell: ({ row }) => {
        const key = row.original.key;
        const isLoading = loadingKeys.has(key);
        const revealed = revealedValues[key];

        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">
              {revealed || "••••••••••••"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleReveal(key)}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : revealed ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Beschreibung",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("description") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Aktualisiert",
      cell: ({ row }) => {
        const date = new Date(row.getValue("updatedAt"));
        return (
          <span className="text-muted-foreground text-sm">
            {date.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const setting = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(setting)}>
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(setting)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Settings filtern..."
          value={(table.getColumn("key")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("key")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Badge variant="secondary" className="ml-auto">
          {data.length} Setting{data.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Keine Settings vorhanden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Zurück
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Weiter
          </Button>
        </div>
      )}
    </div>
  );
};
