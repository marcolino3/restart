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
  Mars,
  MoreHorizontal,
  Pencil,
  Trash2,
  Venus,
  VenusAndMars,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { StudentListItem } from "../actions/get-students.action";
import { deleteStudentAction } from "../actions/delete-student.action";
import { handleAction } from "@/lib/actions/handle-action";

interface Props {
  data: StudentListItem[];
}

const GENDER_META: Record<string, { icon: LucideIcon; className: string }> = {
  MALE: { icon: Mars, className: "text-blue-600 dark:text-blue-400" },
  FEMALE: { icon: Venus, className: "text-pink-600 dark:text-pink-400" },
  OTHER: {
    icon: VenusAndMars,
    className: "text-purple-600 dark:text-purple-400",
  },
};

const useColumns = (): ColumnDef<StudentListItem>[] => {
  const t = useTranslations("Common");
  const tS = useTranslations("Students");
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
      id: "dateOfBirth",
      accessorKey: "dateOfBirth",
      header: t("dateOfBirth"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        return value ? (
          <div>{new Date(value).toLocaleDateString("de-CH")}</div>
        ) : null;
      },
    },
    {
      id: "gender",
      accessorKey: "gender",
      header: t("gender"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return null;
        const meta = GENDER_META[value];
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <span title={t(value)} aria-label={t(value)}>
            <Icon className={`h-4 w-4 ${meta.className}`} aria-hidden />
          </span>
        );
      },
      filterFn: "equalsString",
    },
    {
      id: "class",
      accessorFn: (row) => row.currentClass?.name ?? "",
      header: t("class"),
      cell: ({ row }) => {
        const cls = row.original.currentClass;
        if (!cls?.name) {
          return <span className="text-muted-foreground">–</span>;
        }
        return (
          <Badge
            variant="default"
            className={cls.color ? "border-transparent text-white" : undefined}
            style={cls.color ? { backgroundColor: cls.color } : undefined}
          >
            {cls.name}
          </Badge>
        );
      },
      filterFn: "equalsString",
    },
    {
      id: "gradeLevel",
      accessorFn: (row) =>
        (row.currentClass?.gradeLevels ?? []).map((gl) => gl.name),
      header: t("gradeLevel"),
      cell: ({ row }) => {
        const gradeLevels = row.original.currentClass?.gradeLevels ?? [];
        return gradeLevels.length ? (
          <div className="flex flex-wrap gap-1">
            {gradeLevels.map((gl) => (
              <Badge
                key={gl.id}
                variant="default"
                className={
                  gl.color ? "border-transparent text-white" : undefined
                }
                style={gl.color ? { backgroundColor: gl.color } : undefined}
              >
                {gl.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">–</span>
        );
      },
      filterFn: "arrIncludes",
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original;
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
                  href={ROUTES.admin.studentsEdit(locale, student.id)}
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
                    action: () => deleteStudentAction(student.id),
                    successMessage: tS("studentDeleted"),
                    errorMessage: tS("studentDeleteError"),
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

export const StudentsTable = ({ data }: Props) => {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const columns = useColumns();

  // Distinct option lists for the categorical filters, derived from the data.
  const genderOptions = React.useMemo(
    () =>
      Array.from(
        new Set(data.map((s) => s.gender).filter((g): g is string => !!g)),
      ),
    [data],
  );
  const classOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          data.map((s) => s.currentClass?.name).filter((n): n is string => !!n),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [data],
  );
  const gradeLevelOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          data.flatMap((s) =>
            (s.currentClass?.gradeLevels ?? []).map((gl) => gl.name),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [data],
  );

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
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
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
        {genderOptions.length > 0 && (
          <Select
            value={
              (table.getColumn("gender")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("gender")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("gender")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allGenders")}</SelectItem>
              {genderOptions.map((g) => {
                const meta = GENDER_META[g];
                const Icon = meta?.icon;
                return (
                  <SelectItem key={g} value={g}>
                    <span className="flex items-center gap-2">
                      {Icon && (
                        <Icon
                          className={`h-4 w-4 ${meta.className}`}
                          aria-hidden
                        />
                      )}
                      {t(g)}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
        {classOptions.length > 0 && (
          <Select
            value={
              (table.getColumn("class")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("class")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("class")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allClasses")}</SelectItem>
              {classOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {gradeLevelOptions.length > 0 && (
          <Select
            value={
              (table.getColumn("gradeLevel")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("gradeLevel")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("gradeLevel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allGradeLevels")}</SelectItem>
              {gradeLevelOptions.map((gl) => (
                <SelectItem key={gl} value={gl}>
                  {gl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={() => {
                    router.push(
                      ROUTES.admin.studentsView(locale, row.original.id)
                    );
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (
                          cell.column.id === "select" ||
                          cell.column.id === "actions"
                        ) {
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
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span className="ml-2">
              ({table.getFilteredSelectedRowModel().rows.length}{" "}
              {t("selected")})
            </span>
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
