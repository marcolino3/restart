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
  type SortingFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  addWeeks,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
  subDays,
} from "date-fns";
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

import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
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

import { deleteTaskAction } from "../actions/manage-tasks.action";
import { reorderMyTasksAction } from "../actions/reorder-my-tasks.action";
import { updateTaskStatusAction } from "../actions/update-task-status.action";
import {
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../types";
import { PersonalTaskDialog, type ProjectOption } from "./PersonalTaskDialog";

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

// Column dot colors mirroring the design (slate/sky/rose/green).
const STATUS_DOT: Record<TaskStatus, string> = {
  OPEN: "bg-slate-400",
  IN_PROGRESS: "bg-sky-500",
  BLOCKED: "bg-rose-500",
  DONE: "bg-green-500",
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

type ViewMode = "list" | "board";
type DueFilter = "all" | "today" | "thisWeek" | "nextWeek" | "none";
type TaskSource = "project" | "protocol" | "admission" | "personal";
type SourceFilter = "all" | TaskSource;

const VIEW_STORAGE_KEY = "my-tasks:view";
const DONE_WINDOW_DAYS = 30;

const DUE_FILTERS: DueFilter[] = ["all", "today", "thisWeek", "nextWeek", "none"];
const SOURCE_FILTERS: SourceFilter[] = [
  "all",
  "project",
  "protocol",
  "admission",
  "personal",
];

const DUE_FILTER_KEY: Record<DueFilter, string> = {
  all: "dueFilterAll",
  today: "dueFilterToday",
  thisWeek: "dueFilterThisWeek",
  nextWeek: "dueFilterNextWeek",
  none: "dueFilterNone",
};
const SOURCE_FILTER_KEY: Record<SourceFilter, string> = {
  all: "sourceFilterAll",
  project: "sourceFilterProjects",
  protocol: "sourceFilterProtocols",
  admission: "sourceFilterAdmissions",
  personal: "sourceFilterPersonal",
};

function taskSource(task: Task): TaskSource {
  if (task.project) return "project";
  if (task.protocol) return "protocol";
  if (task.admissionApplicationId || task.admissionApplication) {
    return "admission";
  }
  return "personal";
}

/** Only tasks without any linked source (project/protocol/admission) may be deleted here. */
const isDeletable = (task: Task) => taskSource(task) === "personal";

function matchesDueFilter(task: Task, filter: DueFilter): boolean {
  if (filter === "all") return true;
  if (filter === "none") return !task.dueDate;
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  if (filter === "today") return isToday(due);
  if (filter === "thisWeek") {
    // Everything up to the end of the current week (incl. overdue).
    return due <= endOfWeek(now, { weekStartsOn: 1 });
  }
  const nextWeek = addWeeks(now, 1);
  return (
    due >= startOfWeek(nextWeek, { weekStartsOn: 1 }) &&
    due <= endOfWeek(nextWeek, { weekStartsOn: 1 })
  );
}

const isRecentlyCompleted = (task: Task) =>
  task.status === "DONE" &&
  !!task.completedAt &&
  new Date(task.completedAt) >= subDays(new Date(), DONE_WINDOW_DAYS);

export function MyTasksTable({
  tasks,
  projects,
}: {
  tasks: Task[];
  projects?: ProjectOption[];
}) {
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
  const [search, setSearch] = React.useState("");
  const [dueFilter, setDueFilter] = React.useState<DueFilter>("all");
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("all");
  const [showDone, setShowDone] = React.useState(false);
  const [showAllBoardDone, setShowAllBoardDone] = React.useState(false);
  const [personalDialog, setPersonalDialog] = React.useState<{
    open: boolean;
    task: Task | null;
  }>({ open: false, task: null });

  // View mode persists per browser; read after mount to avoid hydration drift.
  const [view, setViewState] = React.useState<ViewMode>("list");
  React.useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "board" || stored === "list") setViewState(stored);
  }, []);
  const setView = (next: ViewMode) => {
    setViewState(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Persisting the preference is best-effort only.
    }
  };

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

  const openTask = React.useCallback(
    (task: Task) => {
      const source = taskSource(task);
      if (source === "project" && task.project) {
        router.push(ROUTES.admin.projectsBoard(locale, task.project.id));
        return;
      }
      if (source === "protocol" && task.protocol) {
        router.push(ROUTES.admin.protocolEditor(locale, task.protocol.id));
        return;
      }
      if (source === "admission") {
        const admissionId =
          task.admissionApplication?.id ?? task.admissionApplicationId;
        if (admissionId) {
          router.push(`/${locale}/admin/admissions/${admissionId}`);
          return;
        }
      }
      setPersonalDialog({ open: true, task });
    },
    [locale, router],
  );

  const deleteTask = async (task: Task) => {
    const res = await deleteTaskAction(task.id);
    if (res.success) {
      router.refresh();
      return { success: true };
    }
    return { success: false, error: String(res.error) };
  };

  // Search + both selects apply to the list AND the board.
  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter(
      (task) =>
        (!query || task.title.toLowerCase().includes(query)) &&
        matchesDueFilter(task, dueFilter) &&
        (sourceFilter === "all" || taskSource(task) === sourceFilter),
    );
  }, [data, search, dueFilter, sourceFilter]);

  const openTasks = React.useMemo(
    () => filtered.filter((task) => task.status !== "DONE"),
    [filtered],
  );
  // Completed section/column: only the last 30 days.
  const doneTasks = React.useMemo(
    () => filtered.filter(isRecentlyCompleted),
    [filtered],
  );

  const sourceCell = (task: Task) => {
    const { project, protocol, admissionApplication } = task;
    return (
      <div className="flex flex-col items-start gap-1">
        {project && (
          <Badge
            variant="outline"
            className="flex w-fit items-center gap-1"
            style={project.color ? { borderColor: project.color } : undefined}
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
          <Badge variant="secondary" className="flex w-fit items-center gap-1">
            <FileText className="h-3 w-3" />
            {protocol.title}
          </Badge>
        )}
        {admissionApplication && (
          <Badge variant="amber" className="flex w-fit items-center gap-1">
            <Bell className="h-3 w-3" />
            {t("sourceAdmission")}: {admissionApplication.childFirstName}{" "}
            {admissionApplication.childLastName}
          </Badge>
        )}
        {taskSource(task) === "personal" && (
          <span className="text-muted-foreground">{t("personal")}</span>
        )}
      </div>
    );
  };

  const deleteButton = (task: Task) =>
    isDeletable(task) ? (
      <DeleteConfirmationDialog
        onConfirm={() => deleteTask(task)}
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label={tc("delete")}
          >
            <X className="h-4 w-4" />
          </Button>
        }
      />
    ) : null;

  const columns = React.useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => sortHeader(column, t("taskTitle")),
        cell: ({ getValue }) => (
          <div className="font-medium">{getValue<string>()}</div>
        ),
      },
      {
        id: "source",
        accessorFn: (row) => row.project?.title ?? "",
        header: ({ column }) => sortHeader(column, t("source")),
        cell: ({ row }) => sourceCell(row.original),
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
              {row.original.dueTime ? ` · ${row.original.dueTime}` : ""}
            </span>
          );
        },
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
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => null,
        cell: ({ row }) => deleteButton(row.original),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const table = useReactTable({
    data: openTasks,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    state: { sorting },
    initialState: { pagination: { pageSize: 20 } },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 py-4">
        <Input
          placeholder={t("filterTitle")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[240px]"
        />
        <Select
          value={dueFilter}
          onValueChange={(v) => setDueFilter(v as DueFilter)}
        >
          <SelectTrigger className="h-9 w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DUE_FILTERS.map((f) => (
              <SelectItem key={f} value={f}>
                {t(DUE_FILTER_KEY[f])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sourceFilter}
          onValueChange={(v) => setSourceFilter(v as SourceFilter)}
        >
          <SelectTrigger className="h-9 w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_FILTERS.map((f) => (
              <SelectItem key={f} value={f}>
                {t(SOURCE_FILTER_KEY[f])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <div className="inline-flex items-center rounded-md border p-0.5">
          <Button
            type="button"
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-3"
            onClick={() => setView("board")}
          >
            {t("viewBoard")}
          </Button>
          <Button
            type="button"
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-3"
            onClick={() => setView("list")}
          >
            {t("viewList")}
          </Button>
        </div>
        <Button
          size="sm"
          onClick={() => setPersonalDialog({ open: true, task: null })}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("newTask")}
        </Button>
      </div>

      {view === "board" ? (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => {
            const columnTasks =
              status === "DONE"
                ? doneTasks
                : openTasks.filter((task) => task.status === status);
            const isDone = status === "DONE";
            const visibleTasks =
              isDone && !showAllBoardDone
                ? columnTasks.slice(0, 2)
                : columnTasks;
            const hiddenCount = columnTasks.length - visibleTasks.length;
            return (
              <div key={status} className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      STATUS_DOT[status],
                    )}
                  />
                  <span className="text-sm font-medium">
                    {t(`taskStatus_${status}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {visibleTasks.map((task) => (
                    <BoardCard
                      key={task.id}
                      task={task}
                      done={isDone}
                      onOpen={() => openTask(task)}
                    />
                  ))}
                  {isDone && hiddenCount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setShowAllBoardDone(true)}
                    >
                      {t("showMoreDone", { count: hiddenCount })}
                    </Button>
                  )}
                  {isDone && showAllBoardDone && columnTasks.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setShowAllBoardDone(false)}
                    >
                      {t("showLessDone")}
                    </Button>
                  )}
                </div>
                {isDone && (
                  <p className="pt-2 text-center text-[11px] text-muted-foreground">
                    {t("boardDoneArchiveHint")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
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
                          onOpen={() => openTask(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              onClick={(e) => {
                                if (
                                  cell.column.id === "status" ||
                                  cell.column.id === "actions"
                                ) {
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
              {openTasks.length} {tc("results")}
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

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t("deleteHint")}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowDone((prev) => !prev)}
            >
              {t("completedTasksToggle", { count: doneTasks.length })}
            </Button>
          </div>

          {showDone && (
            <>
              <div className="mt-2 rounded-md border opacity-75">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("completedTask")}</TableHead>
                      <TableHead>{t("source")}</TableHead>
                      <TableHead>{t("completedAt")}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doneTasks.length ? (
                      doneTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <span className="font-medium text-muted-foreground line-through">
                              {task.title}
                            </span>
                          </TableCell>
                          <TableCell>{sourceCell(task)}</TableCell>
                          <TableCell>
                            {task.completedAt
                              ? format(
                                  new Date(task.completedAt),
                                  "dd. MMM yyyy",
                                  { locale: de },
                                )
                              : "–"}
                          </TableCell>
                          <TableCell>{deleteButton(task)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-16 text-center">
                          {t("noTasks")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("completedHint")}
              </p>
            </>
          )}
        </>
      )}

      <PersonalTaskDialog
        open={personalDialog.open}
        onOpenChange={(open) =>
          setPersonalDialog((prev) => ({ ...prev, open }))
        }
        task={personalDialog.task}
        projects={projects}
      />
    </div>
  );
}

function BoardCard({
  task,
  done,
  onOpen,
}: {
  task: Task;
  done: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("Projects");

  const source = taskSource(task);
  let sourceLabel: string | null = null;
  if (source === "project" && task.project) {
    sourceLabel = task.project.title;
  } else if (source === "protocol" && task.protocol) {
    sourceLabel = `${t("sourceProtocol")} · ${task.protocol.title}`;
  } else if (source === "admission" && task.admissionApplication) {
    sourceLabel = `${t("sourceAdmission")}: ${task.admissionApplication.childFirstName} ${task.admissionApplication.childLastName}`;
  } else if (source === "admission") {
    sourceLabel = t("sourceAdmission");
  }

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const dueIsUrgent = !!due && !done && (isToday(due) || due < new Date());
  const dueLabel = due
    ? `${isToday(due) ? t("quickToday") : format(due, "dd. MMM", { locale: de })}${
        task.dueTime ? `, ${task.dueTime}` : ""
      }`
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full rounded-md border bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent/50",
        done && "opacity-65",
      )}
    >
      <p className="text-sm font-semibold">{task.title}</p>
      {sourceLabel && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sourceLabel}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {done ? (
          <span className="inline-flex rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-200">
            {t("taskStatus_DONE")}
          </span>
        ) : (
          <>
            <span
              className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                PRIORITY_CLASS[task.priority],
              )}
            >
              {t(`priority_${task.priority}`)}
            </span>
            {dueLabel && (
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                  dueIsUrgent
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {dueLabel}
              </span>
            )}
          </>
        )}
      </div>
    </button>
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
