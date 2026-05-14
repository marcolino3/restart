"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { ContactPersonListItem } from "../actions/get-contact-persons.action";
import { archiveContactPersonAction } from "../actions/archive-contact-person.action";
import { handleAction } from "@/lib/actions/handle-action";

interface Props {
  data: ContactPersonListItem[];
}

const useColumns = (): ColumnDef<ContactPersonListItem>[] => {
  const t = useTranslations("Common");
  const tC = useTranslations("ContactPersons");
  const locale = useLocale();

  return [
    {
      id: "lastName",
      accessorKey: "lastName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("lastName")} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => (
        <div className="font-medium">{getValue<string>()}</div>
      ),
      filterFn: "includesString",
    },
    {
      id: "firstName",
      accessorKey: "firstName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("firstName")} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => <div>{getValue<string>()}</div>,
      filterFn: "includesString",
    },
    {
      id: "email",
      accessorKey: "email",
      header: tC("email"),
      cell: ({ getValue }) => (
        <div className="text-sm text-muted-foreground">
          {getValue<string | null>() ?? ""}
        </div>
      ),
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: tC("phone"),
      cell: ({ row }) => {
        const phone = row.original.phone;
        const mobile = row.original.mobile;
        return (
          <div className="text-sm text-muted-foreground">
            {phone ?? mobile ?? ""}
          </div>
        );
      },
    },
    {
      id: "occupation",
      accessorKey: "occupation",
      header: tC("occupation"),
      cell: ({ getValue }) => (
        <div className="text-sm text-muted-foreground">
          {getValue<string | null>() ?? ""}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const cp = row.original;
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
                  href={ROUTES.admin.contactPersonsEdit(locale, cp.id)}
                  className="flex gap-2"
                >
                  <Pencil className="h-4 w-4" /> {t("edit")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={async () => {
                  await handleAction({
                    action: () => archiveContactPersonAction(cp.id),
                    successMessage: tC("contactPersonArchived"),
                    errorMessage: tC("contactPersonArchiveError"),
                  });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};

export const ContactPersonsTable = ({ data }: Props) => {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const columns = useColumns();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const handlePageSizeChange = (value: string) => {
    const newPageSize = value === "all" ? data.length : Number(value);
    setPagination({ pageIndex: 0, pageSize: newPageSize });
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2 flex-wrap">
        <Input
          placeholder={t("filterLastName")}
          value={
            (table.getColumn("lastName")?.getFilterValue() as string) ?? ""
          }
          onChange={(e) =>
            table.getColumn("lastName")?.setFilterValue(e.target.value)
          }
          className="max-w-[180px]"
        />
        <Input
          placeholder={t("filterFirstName")}
          value={
            (table.getColumn("firstName")?.getFilterValue() as string) ?? ""
          }
          onChange={(e) =>
            table.getColumn("firstName")?.setFilterValue(e.target.value)
          }
          className="max-w-[180px]"
        />
        <Select
          value={
            pagination.pageSize >= data.length
              ? "all"
              : String(pagination.pageSize)
          }
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("show")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 {t("items")}</SelectItem>
            <SelectItem value="25">25 {t("items")}</SelectItem>
            <SelectItem value="50">50 {t("items")}</SelectItem>
            <SelectItem value="all">{t("all")}</SelectItem>
          </SelectContent>
        </Select>
        {columnFilters.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => setColumnFilters([])}
            className="h-8 px-2 lg:px-3"
          >
            {t("resetFilters")}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {t("columns")} <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => {
                    router.push(
                      ROUTES.admin.contactPersonsEdit(locale, row.original.id)
                    );
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (cell.column.id === "actions") {
                          e.stopPropagation();
                        }
                      }}
                    >
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
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} {t("results")}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("next")}
          </Button>
        </div>
      </div>
    </div>
  );
};
