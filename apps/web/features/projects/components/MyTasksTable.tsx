"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowUpDown, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DataTableFacetedFilter } from "@/components/common/DataTableFacetedFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

import { updateTaskStatusAction } from "../actions/update-task-status.action";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../types";

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

const multiSelectFilter: FilterFn<Task> = (row, columnId, filterValue) => {
  const picks = filterValue as string[] | undefined;
  if (!picks?.length) return true;
  return picks.includes(row.getValue<string>(columnId));
};

export function MyTasksTable({ tasks }: { tasks: Task[] }) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "dueDate", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const onChangeStatus = async (task: Task, status: TaskStatus) => {
    await updateTaskStatusAction(task.id, status, task.project?.id);
    router.refresh();
  };

  const projectOptions = React.useMemo(() => {
    const map = new Map<string, string | null>();
    for (const task of tasks) {
      if (task.project) map.set(task.project.title, task.project.color ?? null);
    }
    return Array.from(map, ([title, color]) => ({ title, color })).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [tasks]);

  const columns = React.useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("taskTitle")} <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="font-medium">{getValue<string>()}</div>
        ),
        filterFn: "includesString",
      },
      {
        id: "project",
        accessorFn: (row) => row.project?.title ?? "",
        header: t("project"),
        cell: ({ row }) => {
          const project = row.original.project;
          if (!project) return <span className="text-muted-foreground">–</span>;
          return (
            <Badge
              variant="outline"
              className="flex w-fit items-center gap-1"
              style={
                project.color
                  ? { borderColor: project.color }
                  : undefined
              }
            >
              {project.color && (
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
              )}
              {project.title}
            </Badge>
          );
        },
        filterFn: multiSelectFilter,
      },
      {
        id: "status",
        accessorKey: "status",
        header: t("taskStatus"),
        cell: ({ row }) => (
          <Select
            value={row.original.status}
            onValueChange={(v) => onChangeStatus(row.original, v as TaskStatus)}
          >
            <SelectTrigger className="h-8 w-40" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`taskStatus_${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
        filterFn: multiSelectFilter,
      },
      {
        id: "priority",
        accessorKey: "priority",
        header: t("priority"),
        cell: ({ getValue }) => {
          const value = getValue<TaskPriority>();
          return (
            <Badge className={cn("border-0", PRIORITY_CLASS[value])}>
              {t(`priority_${value}`)}
            </Badge>
          );
        },
        filterFn: multiSelectFilter,
      },
      {
        id: "dueDate",
        accessorKey: "dueDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("dueDate")} <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue, row }) => {
          const value = getValue<string | null>();
          if (!value) return <span className="text-muted-foreground">–</span>;
          const overdue =
            row.original.status !== "DONE" && new Date(value) < new Date();
          return (
            <span className={cn(overdue && "font-medium text-destructive")}>
              {format(new Date(value), "dd. MMM yyyy", { locale: de })}
            </span>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  const table = useReactTable({
    data: tasks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 20 } },
  });

  const facet = (
    columnId: string,
    title: string,
    options: { value: string; label: React.ReactNode; searchValue?: string }[]
  ) => (
    <DataTableFacetedFilter
      title={title}
      selected={(table.getColumn(columnId)?.getFilterValue() as string[]) ?? []}
      onChange={(next) =>
        table
          .getColumn(columnId)
          ?.setFilterValue(next.length ? next : undefined)
      }
      options={options}
    />
  );

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 py-4">
        <Input
          placeholder={t("filterTitle")}
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("title")?.setFilterValue(e.target.value)
          }
          className="max-w-[200px]"
        />
        {facet(
          "status",
          t("taskStatus"),
          TASK_STATUSES.map((s) => ({
            value: s,
            searchValue: t(`taskStatus_${s}`),
            label: t(`taskStatus_${s}`),
          }))
        )}
        {facet(
          "priority",
          t("priority"),
          TASK_PRIORITIES.map((p) => ({
            value: p,
            searchValue: t(`priority_${p}`),
            label: t(`priority_${p}`),
          }))
        )}
        {projectOptions.length > 0 &&
          facet(
            "project",
            t("project"),
            projectOptions.map((p) => ({
              value: p.title,
              searchValue: p.title,
              label: (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: p.color ?? "var(--muted)" }}
                  />
                  {p.title}
                </span>
              ),
            }))
          )}
        {columnFilters.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => setColumnFilters([])}
            className="h-8 px-2 lg:px-3"
          >
            {tc("resetFilters")}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
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
                    if (row.original.project) {
                      router.push(
                        ROUTES.admin.projectsBoard(
                          locale,
                          row.original.project.id
                        )
                      );
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (cell.column.id === "status") e.stopPropagation();
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
                  {t("noTasks")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} {tc("results")}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {tc("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {tc("next")}
        </Button>
      </div>
    </div>
  );
}
