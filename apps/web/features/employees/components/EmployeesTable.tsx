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
import { ArrowUpDown, ChevronDown, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PersonCell } from "@/components/common/PersonCell";
import { FilterChip } from "@/components/common/FilterChip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import type { BadgeProps } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { EmployeeListItem } from "../actions/get-employees.action";
import { EmployeeActionsCell } from "./EmployeeActionsCell";
import { EmployeeAvatar } from "./EmployeeAvatar";

interface Props {
  data: EmployeeListItem[];
}

/** Persona → status-pill variant, following the design-handoff role colours. */
const PERSONA_VARIANT: Record<string, BadgeProps["variant"]> = {
  TEACHER: "accent",
  ADMIN: "amber",
  HR: "amber",
  OFFICE: "sky",
  ASSISTANT: "sky",
  PARENT: "slate",
  STUDENT: "slate",
  EMPLOYEE: "slate",
};

const fullName = (row: EmployeeListItem) =>
  `${row.membership.user?.firstName ?? ""} ${
    row.membership.user?.lastName ?? ""
  }`.trim();

const primaryEmail = (row: EmployeeListItem) => {
  const emails = row.membership.user?.userEmails;
  return emails?.find((e) => e.isPrimary)?.email ?? emails?.[0]?.email ?? "";
};

const teamNames = (row: EmployeeListItem) =>
  (row.teamMembers ?? [])
    .map((tm) => tm.team?.name)
    .filter((n): n is string => !!n);

/** Minutes → "+12:30" / "−2:15" (design handoff `.mono` Zeitsaldo). */
const formatBalance = (mins: number): string => {
  const sign = mins < 0 ? "−" : "+";
  const abs = Math.abs(mins);
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
};

/** Search across name + email for the merged person column. */
const personFilter: FilterFn<EmployeeListItem> = (row, _columnId, value) => {
  const needle = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  const hay = `${fullName(row.original)} ${primaryEmail(
    row.original,
  )}`.toLowerCase();
  return hay.includes(needle);
};

const useColumns = (): ColumnDef<EmployeeListItem>[] => {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");

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
      id: "person",
      accessorFn: (row) => row.membership.user?.lastName ?? "",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("person")} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <PersonCell
          avatar={
            <EmployeeAvatar
              firstName={row.original.membership.user?.firstName}
              lastName={row.original.membership.user?.lastName}
              className="size-8"
            />
          }
          name={fullName(row.original) || "—"}
          subtitle={primaryEmail(row.original) || undefined}
        />
      ),
      filterFn: personFilter,
    },
    {
      id: "persona",
      accessorFn: (row) => row.membership.persona,
      header: t("role"),
      filterFn: (row, id, value) => {
        const picks = value as string[] | undefined;
        return !picks?.length || picks.includes(row.getValue<string>(id));
      },
      cell: ({ row }) => {
        const persona = row.original.membership.persona;
        return (
          <Badge variant={PERSONA_VARIANT[persona] ?? "slate"}>
            {t(persona)}
          </Badge>
        );
      },
    },
    {
      id: "team",
      accessorFn: (row) => teamNames(row).join(", "),
      header: t("team"),
      enableSorting: false,
      cell: ({ row }) => {
        const names = teamNames(row.original);
        return names.length ? (
          <span className="text-muted-foreground">{names.join(" · ")}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "workloadPercent",
      accessorFn: (row) => row.workloadPercent ?? -1,
      header: t("workloadPercent"),
      cell: ({ row }) => {
        const pct = row.original.workloadPercent;
        if (pct == null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="inline-flex items-center gap-[9px]">
            <span className="h-2 w-20 overflow-hidden rounded-full bg-field">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </span>
            <span className="text-[13px] tabular-nums">{pct}%</span>
          </span>
        );
      },
    },
    {
      id: "timeBalanceMinutes",
      accessorFn: (row) => row.timeBalanceMinutes ?? null,
      header: t("timeBalanceMinutes"),
      cell: ({ row }) => {
        const bal = row.original.timeBalanceMinutes;
        if (bal == null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="font-mono text-[12.5px] tabular-nums">
            {formatBalance(bal)}
          </span>
        );
      },
    },
    {
      id: "status",
      accessorFn: (row) => row.membership.employee?.isActive ?? true,
      header: tE("statusToday"),
      filterFn: (row, id, value) =>
        value === undefined || row.getValue<boolean>(id) === value,
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
      cell: ({ row }) => <EmployeeActionsCell row={row.original} />,
    },
  ];
};

/**
 * Feste Filter-Gruppen aus dem Design-Handoff (`.chiprow`): Alle · Lehrkräfte ·
 * Administration · Betreuung · Inaktiv. Jede Gruppe bündelt die passenden
 * Personas; "Inaktiv" filtert über den Status.
 */
const PERSONA_GROUPS = [
  { key: "TEACHERS", labelKey: "chipTeachers", personas: ["TEACHER"] },
  {
    key: "ADMIN",
    labelKey: "chipAdmin",
    personas: ["ADMIN", "HR", "OFFICE"],
  },
  {
    key: "CARE",
    labelKey: "chipCare",
    personas: ["ASSISTANT", "EMPLOYEE"],
  },
] as const;

const sameMembers = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

export const EmployeesTable = ({ data }: Props) => {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();
  const columns = useColumns();

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

  // Chip-Filter (design handoff `.chiprow`): feste Gruppen, Einfach-Auswahl —
  // treibt die persona-/status-Spaltenfilter.
  const personaFilter = table.getColumn("persona")?.getFilterValue() as
    | string[]
    | undefined;
  const inactiveActive = table.getColumn("status")?.getFilterValue() === false;
  const activeGroup = personaFilter?.length
    ? PERSONA_GROUPS.find((g) => sameMembers(g.personas, personaFilter))?.key
    : undefined;
  const activeChip = inactiveActive ? "INACTIVE" : (activeGroup ?? "ALL");

  const setChip = (key: string) => {
    const personaCol = table.getColumn("persona");
    const statusCol = table.getColumn("status");
    if (key === "ALL") {
      personaCol?.setFilterValue(undefined);
      statusCol?.setFilterValue(undefined);
    } else if (key === "INACTIVE") {
      personaCol?.setFilterValue(undefined);
      statusCol?.setFilterValue(false);
    } else {
      const group = PERSONA_GROUPS.find((g) => g.key === key);
      personaCol?.setFilterValue(group ? [...group.personas] : undefined);
      statusCol?.setFilterValue(undefined);
    }
  };

  return (
    <div className="w-full">
      {/* Search first, then filter chips + controls — one row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-[280px]">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tE("searchPlaceholder")}
            value={
              (table.getColumn("person")?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn("person")?.setFilterValue(e.target.value)
            }
            className="h-9 rounded-full pl-9"
            aria-label={tE("searchPlaceholder")}
          />
        </div>

        {/* Filter chips (design handoff `.chiprow`) */}
        <FilterChip active={activeChip === "ALL"} onClick={() => setChip("ALL")}>
          {t("all")}
        </FilterChip>
        {PERSONA_GROUPS.map((g) => (
          <FilterChip
            key={g.key}
            active={activeChip === g.key}
            onClick={() => setChip(g.key)}
          >
            {tE(g.labelKey)}
          </FilterChip>
        ))}
        <FilterChip
          active={activeChip === "INACTIVE"}
          onClick={() => setChip("INACTIVE")}
        >
          {t("inactive")}
        </FilterChip>

        {/* Reset filters */}
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

        {/* Column visibility */}
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

      {/* Table */}
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
              table.getRowModel().rows.map((row) => {
                const empId = row.original.membership.employee?.id;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={empId ? "cursor-pointer" : ""}
                    onClick={() => {
                      if (empId) {
                        router.push(
                          ROUTES.admin.employeesView(locale, empId)
                        );
                      }
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
                );
              })
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

      {/* Footer */}
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
