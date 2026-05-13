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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { UserListItem } from "../actions/get-users.action";

interface Props {
  data: UserListItem[];
}

const UsersTableColumns = (): ColumnDef<UserListItem>[] => {
  const t = useTranslations("Common");
  const locale = useLocale();

  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
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
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t("selectRow")}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
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
      accessorKey: "lastName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("lastName")} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => <div>{getValue<string>()}</div>,
      filterFn: "includesString",
    },
    {
      id: "email",
      accessorFn: (row) => {
        return row.userEmails?.map((e) => e.email).join(" ") ?? "";
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("email")} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const primary = row.original.userEmails?.find((e) => e.isPrimary);
        const email = primary?.email ?? row.original.userEmails?.[0]?.email ?? "";
        return <div className="text-muted-foreground">{email}</div>;
      },
      filterFn: "includesString",
    },
    {
      id: "organization",
      accessorFn: (row) => {
        return row.memberships?.map((m) => m.organization.name).join(" ") ?? "";
      },
      header: t("organization"),
      cell: ({ row }) => {
        const memberships = row.original.memberships;
        if (!memberships?.length)
          return <span className="text-muted-foreground">–</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {memberships.map((m) => (
              <Badge key={m.id} variant="secondary">
                {m.organization.name}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: "includesString",
    },
    {
      id: "loginMethods",
      header: t("loginMethods"),
      cell: ({ row }) => {
        const providers = new Set<string>();
        row.original.userEmails?.forEach((ue) =>
          ue.authAccounts?.forEach((aa) => providers.add(aa.provider))
        );
        return (
          <div className="flex flex-wrap gap-1">
            {providers.has("GOOGLE") && (
              <Badge variant="outline">Google</Badge>
            )}
            {providers.has("APPLE") && (
              <Badge variant="outline">Apple</Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "isActive",
      header: t("isActive"),
      cell: ({ row }) => {
        const value = row.getValue("isActive") as boolean;
        return value ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
            {t("active")}
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
            {t("inactive")}
          </Badge>
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
                  href={ROUTES.admin.usersEdit(locale, data.id)}
                  className="flex gap-2"
                >
                  <Pencil className="h-4 w-4" /> {t("edit")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};

export const UsersTable = ({ data }: Props) => {
  const t = useTranslations("Common");
  const columns = UsersTableColumns();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
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
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
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
      rowSelection,
      pagination,
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // Unique org names for org filter
  const orgNames = React.useMemo(() => {
    const names = new Set<string>();
    data.forEach((u) =>
      u.memberships?.forEach((m) => names.add(m.organization.name))
    );
    return Array.from(names).sort();
  }, [data]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2 flex-wrap">
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
          placeholder={t("filterEmail")}
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("email")?.setFilterValue(e.target.value)
          }
          className="max-w-[220px]"
        />
        <Select
          value={
            (table.getColumn("organization")?.getFilterValue() as string) ?? "__all__"
          }
          onValueChange={(value) =>
            table
              .getColumn("organization")
              ?.setFilterValue(value === "__all__" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filterOrganization")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("all")}</SelectItem>
            {orgNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={
            pagination.pageSize >= data.length
              ? "all"
              : String(pagination.pageSize)
          }
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="w-[140px] ml-auto">
            <SelectValue placeholder={t("show")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 {t("items")}</SelectItem>
            <SelectItem value="all">{t("all")}</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
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
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectedCount > 0 ? (
            <>
              {selectedCount} / {table.getFilteredRowModel().rows.length}{" "}
              {t("selected")}
            </>
          ) : (
            <>
              {table.getFilteredRowModel().rows.length} {t("results")}
            </>
          )}
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
