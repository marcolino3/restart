"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingFn,
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
import {
  ArrowUpDown,
  Bell,
  FileText,
  GripVertical,
  Plus,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

import { reorderMyTasksAction } from "../actions/reorder-my-tasks.action";
import { updateTaskStatusAction } from "../actions/update-task-status.action";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../types";
import { PersonalTaskDialog } from "./PersonalTaskDialog";

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

// Meaningful sort order (most → least), not alphabetical.
const PRIORITY_RANK: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};
const STATUS_RANK: Record<TaskStatus, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  BLOCKED: 2,
  DONE: 3,
};

const multiSelectFilter: FilterFn<Task> = (row, columnId, filterValue) => {
  const picks = filterValue as string[] | undefined;
  if (!picks?.length) return true;
  return picks.includes(row.getValue<string>(columnId));
};

const prioritySort: SortingFn<Task> = (a, b) =>
  PRIORITY_RANK[a.original.priority] - PRIORITY_RANK[b.original.priority];
const statusSort: SortingFn<Task> = (a, b) =>
  STATUS_RANK[a.original.status] - STATUS_RANK[b.original.status];

const sortHeader = (
  column: {
    toggleSorting: (desc?: boolean) => void;
    getIsSorted: () => false | "asc" | "desc";
  },
  label: string,
) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  >
    {label} <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
);

export function MyTasksTable({ tasks }: { tasks: Task[] }) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  // Local order = the personal (drag-and-drop) order the server returned.
  const [data, setData] = React.useState<Task[]>(tasks);
  const [seededFrom, setSeededFrom] = React.useState(tasks);
  if (seededFrom !== tasks) {
    setSeededFrom(tasks);
    setData(tasks);
  }

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [personalDialog, setPersonalDialog] = React.useState<{
    open: boolean;
    task: Task | null;
  }>({ open: false, task: null });

  // Manual drag ordering only makes sense without an active column sort.
  const dndEnabled = sorting.length === 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const onChangeStatus = async (task: Task, status: TaskStatus) => {
    await updateTaskStatusAction(task.id, status, task.project?.id);
    router.refresh();
  };

  const persistOrder = async (ids: string[], previous: Task[]) => {
    const result = await reorderMyTasksAction(ids);
    if (!result.success) {
      setData(previous);
      toast.error(t("reorderError"));
    } else {
      router.refresh();
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setData((prev) => {
      const oldIndex = prev.findIndex((tk) => tk.id === active.id);
      const newIndex = prev.findIndex((tk) => tk.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      void persistOrder(
        next.map((tk) => tk.id),
        prev,
      );
      return next;
    });
  };

  const projectOptions = React.useMemo(() => {
    const map = new Map<string, string | null>();
    for (const task of data) {
      if (task.project) map.set(task.project.title, task.project.color ?? null);
    }
    return Array.from(map, ([title, color]) => ({ title, color })).sort(
      (a, b) => a.title.localeCompare(b.title),
    );
  }, [data]);

  const columns = React.useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => sortHeader(column, t("taskTitle")),
        cell: ({ getValue }) => (
          <div className="font-medium">{getValue<string>()}</div>
        ),
        filterFn: "includesString",
      },
      {
        id: "project",
        accessorFn: (row) => row.project?.title ?? "",
        header: ({ column }) => sortHeader(column, t("source")),
        cell: ({ row }) => {
          const { project, protocol, admissionApplication } = row.original;
          return (
            <div className="flex flex-col items-start gap-1">
              {project && (
                <Badge
                  variant="outline"
                  className="flex w-fit items-center gap-1"
                  style={
                    project.color ? { borderColor: project.color } : undefined
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
              )}
              {protocol && (
                <Badge
                  variant="secondary"
                  className="flex w-fit items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  {protocol.title}
                </Badge>
              )}
              {admissionApplication && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/${locale}/admin/admissions/${admissionApplication.id}`,
                    );
                  }}
                  title={t("sourceAdmission")}
                >
                  <Badge
                    variant="amber"
                    className="flex w-fit items-center gap-1 hover:opacity-80"
                  >
                    <Bell className="h-3 w-3" />
                    {t("sourceAdmission")}:{" "}
                    {admissionApplication.childFirstName}{" "}
                    {admissionApplication.childLastName}
                  </Badge>
                </button>
              )}
              {!project && !protocol && !admissionApplication && (
                <span className="text-muted-foreground">{t("personal")}</span>
              )}
            </div>
          );
        },
        filterFn: multiSelectFilter,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => sortHeader(column, t("taskStatus")),
        sortingFn: statusSort,
        cell: ({ row }) => (
          <Select
            value={row.original.status}
            onValueChange={(v) => onChangeStatus(row.original, v as TaskStatus)}
          >
            <SelectTrigger
              className="h-8 w-40"
              onClick={(e) => e.stopPropagation()}
            >
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
        header: ({ column }) => sortHeader(column, t("priority")),
        sortingFn: prioritySort,
        cell: ({ getValue }) => {
          const value = getValue<TaskPriority>();
          return (
            <span
              className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                PRIORITY_CLASS[value],
              )}
            >
              {t(`priority_${value}`)}
            </span>
          );
        },
        filterFn: multiSelectFilter,
      },
      {
        id: "dueDate",
        accessorKey: "dueDate",
        header: ({ column }) => sortHeader(column, t("dueDate")),
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
    [t],
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 20 } },
  });

  const rows = table.getRowModel().rows;

  const facet = (
    columnId: string,
    title: string,
    options: { value: string; label: React.ReactNode; searchValue?: string }[],
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
          })),
        )}
        {facet(
          "priority",
          t("priority"),
          TASK_PRIORITIES.map((p) => ({
            value: p,
            searchValue: t(`priority_${p}`),
            label: t(`priority_${p}`),
          })),
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
            })),
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
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => setPersonalDialog({ open: true, task: null })}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("newTask")}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <TableHead className="w-8" />
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length ? (
                <SortableContext
                  items={rows.map((r) => r.original.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rows.map((row) => (
                    <SortableTaskRow
                      key={row.id}
                      id={row.original.id}
                      dragEnabled={dndEnabled}
                      onOpen={() => {
                        if (row.original.project) {
                          router.push(
                            ROUTES.admin.projectsBoard(
                              locale,
                              row.original.project.id,
                            ),
                          );
                        } else {
                          setPersonalDialog({
                            open: true,
                            task: row.original,
                          });
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          onClick={(e) => {
                            if (cell.column.id === "status") {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </SortableTaskRow>
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center"
                  >
                    {t("noTasks")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DndContext>

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

      <PersonalTaskDialog
        open={personalDialog.open}
        onOpenChange={(open) =>
          setPersonalDialog((prev) => ({ ...prev, open }))
        }
        task={personalDialog.task}
      />
    </div>
  );
}

function SortableTaskRow({
  id,
  dragEnabled,
  onOpen,
  children,
}: {
  id: string;
  dragEnabled: boolean;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !dragEnabled });

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("cursor-pointer", isDragging && "opacity-50")}
      onClick={onOpen}
      {...attributes}
    >
      {/* The drag handle lives in the first ("drag") cell. */}
      <TableCell
        className="w-8"
        onClick={(e) => e.stopPropagation()}
        ref={setActivatorNodeRef}
        {...(dragEnabled ? listeners : {})}
      >
        <GripVertical
          className={cn(
            "h-4 w-4 text-muted-foreground",
            dragEnabled ? "cursor-grab" : "opacity-30",
          )}
        />
      </TableCell>
      {children}
    </TableRow>
  );
}
