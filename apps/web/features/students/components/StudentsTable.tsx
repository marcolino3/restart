"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
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
  Search,
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
import { DataTableFacetedFilter } from "@/components/common/DataTableFacetedFilter";
import { PersonCell } from "@/components/common/PersonCell";
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
import { StudentAvatar } from "./StudentAvatar";
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

const fullName = (row: StudentListItem) =>
  `${row.firstName} ${row.lastName}`.trim();

/** Whole years between a birthdate and now. */
const ageFromDob = (dob: string): number => {
  const b = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
};

/** Multi-select facet match for a scalar cell value against a list of picks. */
const multiSelectFilter: FilterFn<StudentListItem> = (
  row,
  columnId,
  filterValue,
) => {
  const picks = filterValue as string[] | undefined;
  if (!picks?.length) return true;
  return picks.includes(row.getValue<string>(columnId));
};

/** Search across first + last name for the merged name column. */
const nameFilter: FilterFn<StudentListItem> = (row, _columnId, value) => {
  const needle = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  return fullName(row.original).toLowerCase().includes(needle);
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
      id: "name",
      accessorKey: "lastName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("name")} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const s = row.original;
        const dob = s.dateOfBirth;
        const subtitle = dob
          ? tS("birthInfo", {
              date: new Date(dob).toLocaleDateString("de-CH"),
              age: ageFromDob(dob),
            })
          : undefined;
        return (
          <PersonCell
            avatar={
              <StudentAvatar
                studentId={s.id}
                firstName={s.firstName}
                lastName={s.lastName}
                className="size-8"
                fallbackClassName="text-[11px]"
              />
            }
            name={fullName(s) || "—"}
            subtitle={subtitle}
          />
        );
      },
      filterFn: nameFilter,
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
      filterFn: multiSelectFilter,
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
            variant="accent"
            className={cls.color ? "border-transparent text-white" : undefined}
            style={cls.color ? { backgroundColor: cls.color } : undefined}
          >
            {cls.name}
          </Badge>
        );
      },
      filterFn: multiSelectFilter,
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
                variant="secondary"
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
      filterFn: "arrIncludesSome",
    },
    {
      id: "status",
      accessorFn: (row) => row.isActive,
      header: t("status"),
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="green">{t("active")}</Badge>
        ) : (
          <Badge variant="slate">{t("inactive")}</Badge>
        ),
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
  const tS = useTranslations("Students");
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
  const classOptions = React.useMemo(() => {
    const byName = new Map<string, string | null>();
    for (const s of data) {
      const cls = s.currentClass;
      if (cls?.name && !byName.has(cls.name)) {
        byName.set(cls.name, cls.color ?? null);
      }
    }
    return Array.from(byName, ([name, color]) => ({ name, color })).sort(
      (a, b) => a.name.localeCompare(b.name),
    );
  }, [data]);
  const gradeLevelOptions = React.useMemo(() => {
    const byName = new Map<string, string | null>();
    for (const s of data) {
      for (const gl of s.currentClass?.gradeLevels ?? []) {
        if (!byName.has(gl.name)) byName.set(gl.name, gl.color ?? null);
      }
    }
    return Array.from(byName, ([name, color]) => ({ name, color })).sort(
      (a, b) => a.name.localeCompare(b.name),
    );
  }, [data]);

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
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <div className="relative w-[280px]">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tS("searchPlaceholder")}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn("name")?.setFilterValue(e.target.value)
            }
            className="h-9 rounded-full pl-9"
            aria-label={tS("searchPlaceholder")}
          />
        </div>
        {genderOptions.length > 0 && (
          <DataTableFacetedFilter
            title={t("gender")}
            selected={
              (table.getColumn("gender")?.getFilterValue() as string[]) ?? []
            }
            onChange={(next) =>
              table
                .getColumn("gender")
                ?.setFilterValue(next.length ? next : undefined)
            }
            options={genderOptions.map((g) => {
              const meta = GENDER_META[g];
              const Icon = meta?.icon;
              return {
                value: g,
                searchValue: t(g),
                label: (
                  <span className="flex items-center gap-2">
                    {Icon && (
                      <Icon
                        className={`h-4 w-4 ${meta.className}`}
                        aria-hidden
                      />
                    )}
                    {t(g)}
                  </span>
                ),
              };
            })}
          />
        )}
        {classOptions.length > 0 && (
          <DataTableFacetedFilter
            title={t("class")}
            selected={
              (table.getColumn("class")?.getFilterValue() as string[]) ?? []
            }
            onChange={(next) =>
              table
                .getColumn("class")
                ?.setFilterValue(next.length ? next : undefined)
            }
            options={classOptions.map((c) => ({
              value: c.name,
              searchValue: c.name,
              label: (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: c.color ?? "var(--muted)" }}
                  />
                  {c.name}
                </span>
              ),
            }))}
          />
        )}
        {gradeLevelOptions.length > 0 && (
          <DataTableFacetedFilter
            title={t("gradeLevel")}
            selected={
              (table.getColumn("gradeLevel")?.getFilterValue() as string[]) ??
              []
            }
            onChange={(next) =>
              table
                .getColumn("gradeLevel")
                ?.setFilterValue(next.length ? next : undefined)
            }
            options={gradeLevelOptions.map((gl) => ({
              value: gl.name,
              searchValue: gl.name,
              label: (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: gl.color ?? "var(--muted)" }}
                  />
                  {gl.name}
                </span>
              ),
            }))}
          />
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
            className="h-9 px-2 lg:px-3"
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
                  {t(column.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-card border bg-card shadow-xs">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
