"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  IconArchive,
  IconArchiveOff,
  IconArrowLeft,
  IconDotsVertical,
  IconLayoutKanban,
  IconList,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { cn } from "@/lib/utils";

import { archiveProjectAction } from "../actions/archive-project.action";
import { deleteProjectAction } from "../actions/delete-project.action";
import { getProtocolsAction } from "../actions/get-protocols.action";
import { moveTaskAction } from "../actions/manage-tasks.action";
import { updateProjectAction } from "../actions/update-project.action";
import { membershipInitials, membershipName } from "../lib/membership-name";
import {
  TASK_STATUSES,
  type MembershipRef,
  type ProjectDetail,
  type ProjectStatus,
  type ProtocolListItem,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../types";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { ProjectMembersDialog } from "./ProjectMembersDialog";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";

type Columns = Record<TaskStatus, Task[]>;
type BoardTab = "tasks" | "members" | "protocols";

const VIEW_KEY = "project-board:view";

// Status pills from the design handoff (theme-aware --st-* tokens).
const STATUS_VARIANT: Record<ProjectStatus, "green" | "amber" | "slate"> = {
  ACTIVE: "green",
  ON_HOLD: "amber",
  COMPLETED: "slate",
};

// Task-status pills coloured like the board columns (design).
const TASK_STATUS_VARIANT: Record<
  TaskStatus,
  "slate" | "sky" | "rose" | "green"
> = { OPEN: "slate", IN_PROGRESS: "sky", BLOCKED: "rose", DONE: "green" };

// Same priority styling as TaskCard/MyTasksTable.
const PRIORITY_CLASS: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

function groupByStatus(tasks: Task[]): Columns {
  const cols = {
    OPEN: [],
    IN_PROGRESS: [],
    BLOCKED: [],
    DONE: [],
  } as Columns;
  for (const task of tasks) cols[task.status].push(task);
  for (const status of TASK_STATUSES) {
    cols[status].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return cols;
}

type Props = {
  project: ProjectDetail;
  initialTasks: Task[];
  orgMemberships: MembershipRef[];
  canEdit: boolean;
  canManage: boolean;
};

export function ProjectBoard({
  project,
  initialTasks,
  orgMemberships,
  canEdit,
  canManage,
}: Props) {
  const t = useTranslations("Projects");
  const tp = useTranslations("Protocols");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const [columns, setColumns] = React.useState<Columns>(() =>
    groupByStatus(initialTasks)
  );
  // Re-seed from the server when it sends fresh data (after router.refresh()).
  // Storing the previous prop in state and adjusting during render is the
  // React-documented pattern, and avoids an effect-driven cascading render.
  const [seededFrom, setSeededFrom] = React.useState(initialTasks);
  if (seededFrom !== initialTasks) {
    setSeededFrom(initialTasks);
    setColumns(groupByStatus(initialTasks));
  }

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const snapshotRef = React.useRef<Columns | null>(null);

  const [tab, setTab] = React.useState<BoardTab>("tasks");
  // Board/list preference survives reloads via localStorage.
  const [view, setView] = React.useState<"board" | "list">("board");
  React.useEffect(() => {
    const v = window.localStorage.getItem(VIEW_KEY);
    if (v === "board" || v === "list") setView(v);
  }, []);
  React.useEffect(() => {
    window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  const [membersOpen, setMembersOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = React.useState(false);
  const [taskDialog, setTaskDialog] = React.useState<{
    open: boolean;
    task: Task | null;
    status: TaskStatus;
  }>({ open: false, task: null, status: "OPEN" });

  // Protocols are loaded lazily the first time the tab is opened.
  const [protocols, setProtocols] = React.useState<ProtocolListItem[] | null>(
    null
  );
  const [protocolsLoading, setProtocolsLoading] = React.useState(false);
  React.useEffect(() => {
    if (tab !== "protocols" || protocols !== null || protocolsLoading) return;
    let cancelled = false;
    setProtocolsLoading(true);
    void getProtocolsAction().then((res) => {
      if (cancelled) return;
      setProtocols(
        res.success
          ? res.data.filter((p) => p.project?.id === project.id)
          : []
      );
      setProtocolsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, protocols, protocolsLoading, project.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const memberOptions = project.members
    .map((m) => m.membership)
    .filter((m): m is MembershipRef => !!m)
    .map((m) => ({ value: m.id, label: membershipName(m) }));

  const allTasks = TASK_STATUSES.flatMap((s) => columns[s]);
  const doneCount = columns.DONE.length;

  // Defined in the render body, so each render closes over the latest `columns`;
  // dnd-kit always invokes the handler from the most recent render.
  const findContainer = (id: string): TaskStatus | undefined => {
    if ((TASK_STATUSES as string[]).includes(id)) return id as TaskStatus;
    return TASK_STATUSES.find((s) =>
      columns[s].some((task) => task.id === id)
    );
  };

  const activeTask = activeId
    ? Object.values(columns)
        .flat()
        .find((task) => task.id === activeId) ?? null
    : null;

  const onDragStart = (event: DragStartEvent) => {
    snapshotRef.current = columns;
    setActiveId(String(event.active.id));
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeC = findContainer(String(active.id));
    const overC = findContainer(String(over.id));
    if (!activeC || !overC || activeC === overC) return;

    setColumns((prev) => {
      const activeItems = prev[activeC];
      const overItems = prev[overC];
      const activeIndex = activeItems.findIndex((t) => t.id === active.id);
      if (activeIndex < 0) return prev;
      const moved = activeItems[activeIndex];
      const overIndex = overItems.findIndex((t) => t.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeC]: activeItems.filter((t) => t.id !== active.id),
        [overC]: [
          ...overItems.slice(0, insertAt),
          { ...moved, status: overC },
          ...overItems.slice(insertAt),
        ],
      };
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) {
      if (snapshotRef.current) setColumns(snapshotRef.current);
      return;
    }
    const overC = findContainer(String(over.id));
    if (!overC) return;

    setColumns((prev) => {
      const items = prev[overC];
      const oldIndex = items.findIndex((tk) => tk.id === active.id);
      const newIndex = items.findIndex((tk) => tk.id === over.id);
      const reordered =
        oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex
          ? arrayMove(items, oldIndex, newIndex)
          : items;
      const next = { ...prev, [overC]: reordered };
      void persistMove(
        String(active.id),
        overC,
        reordered.map((tk) => tk.id)
      );
      return next;
    });
  };

  const persistMove = async (
    id: string,
    status: TaskStatus,
    orderedTaskIds: string[]
  ) => {
    const result = await moveTaskAction({
      id,
      projectId: project.id,
      status,
      orderedTaskIds,
    });
    if (!result.success) {
      if (snapshotRef.current) setColumns(snapshotRef.current);
      handleAction({
        action: async () => result,
        errorMessage: t("taskMoveError"),
      });
    } else {
      router.refresh();
    }
  };

  const setProjectStatus = async (status: ProjectStatus) => {
    const result = await handleAction({
      action: () =>
        updateProjectAction(project.id, {
          title: project.title,
          description: project.description ?? null,
          status,
          color: project.color ?? null,
          dueDate: project.dueDate ? new Date(project.dueDate) : null,
        }),
      successMessage:
        status === "ON_HOLD" ? t("projectPaused") : t("projectResumed"),
      errorMessage: t("projectUpdateError"),
    });
    if (result.success) router.refresh();
  };

  const tabChip = (value: BoardTab, label: string) => (
    <Button
      size="sm"
      variant={tab === value ? "secondary" : "outline"}
      className="rounded-full"
      onClick={() => setTab(value)}
      aria-pressed={tab === value}
    >
      {label}
    </Button>
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header — title + status pill, summary subline, primary action. */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {project.color && (
              <span
                className="inline-block h-4 w-4 rounded-full"
                style={{ backgroundColor: project.color }}
              />
            )}
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge variant={STATUS_VARIANT[project.status]}>
              {t(`status_${project.status}`)}
            </Badge>
            {project.isArchived && (
              <Badge variant="outline">{t("archived")}</Badge>
            )}
          </div>
          <p className="pt-1 text-sm text-muted-foreground">
            {t("tasksDoneOfTotal", {
              done: doneCount,
              total: allTasks.length,
            })}
            {" · "}
            {t("memberCount", { count: project.members.length })}
            {project.dueDate &&
              ` · ${t("dueOn", {
                date: format(new Date(project.dueDate), "dd. MMMM yyyy", {
                  locale: de,
                }),
              })}`}
          </p>
        </div>
        {canEdit && (
          <Button
            className="gap-1.5"
            onClick={() =>
              setTaskDialog({ open: true, task: null, status: "OPEN" })
            }
          >
            <IconPlus className="h-4 w-4" />
            {t("newTask")}
          </Button>
        )}
      </div>

      {/* Chips row — back link · tabs · view toggle · ⋯ menu (design). */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          asChild
        >
          <Link href={ROUTES.admin.projects(locale)}>
            <IconArrowLeft className="mr-1 h-4 w-4" />
            {t("allProjects")}
          </Link>
        </Button>
        {tabChip("tasks", t("tabTasks"))}
        {tabChip("members", t("members"))}
        {tabChip("protocols", t("tabProtocols"))}

        <div className="ml-auto flex items-center gap-2">
          {tab === "tasks" && (
            <div
              className="flex items-center rounded-md border bg-card p-0.5"
              role="tablist"
              aria-label={t("viewToggle")}
            >
              <Button
                size="sm"
                variant={view === "board" ? "secondary" : "ghost"}
                className="h-7 gap-1 px-2"
                onClick={() => setView("board")}
                aria-pressed={view === "board"}
                title={t("viewBoard")}
              >
                <IconLayoutKanban className="h-4 w-4" />
                <span className="hidden sm:inline">{t("viewBoard")}</span>
              </Button>
              <Button
                size="sm"
                variant={view === "list" ? "secondary" : "ghost"}
                className="h-7 gap-1 px-2"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                title={t("viewList")}
              >
                <IconList className="h-4 w-4" />
                <span className="hidden sm:inline">{t("viewList")}</span>
              </Button>
            </div>
          )}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  aria-label={t("moreOptions")}
                >
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  {t("editProject")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSaveTemplateOpen(true)}>
                  {t("saveAsTemplate")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMembersOpen(true)}>
                  {t("manageMembers")}
                </DropdownMenuItem>
                {project.status === "ON_HOLD" ? (
                  <DropdownMenuItem
                    onClick={() => setProjectStatus("ACTIVE")}
                  >
                    <IconPlayerPlay className="mr-2 h-4 w-4" />
                    {t("resumeProject")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setProjectStatus("ON_HOLD")}
                  >
                    <IconPlayerPause className="mr-2 h-4 w-4" />
                    {t("pauseProject")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={async () => {
                    const res = await archiveProjectAction(
                      project.id,
                      !project.isArchived
                    );
                    if (res.success) router.refresh();
                  }}
                >
                  {project.isArchived ? (
                    <>
                      <IconArchiveOff className="mr-2 h-4 w-4" />
                      {t("unarchive")}
                    </>
                  ) : (
                    <>
                      <IconArchive className="mr-2 h-4 w-4" />
                      {t("archive")}
                    </>
                  )}
                </DropdownMenuItem>
                <DeleteConfirmationDialog
                  title={t("deleteProjectTitle")}
                  description={t("deleteProjectDescription")}
                  onConfirm={async () => {
                    const res = await deleteProjectAction(project.id);
                    if (res.success) {
                      router.push(ROUTES.admin.projects(locale));
                      return { success: true };
                    }
                    return { success: false, error: String(res.error) };
                  }}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive"
                    >
                      <IconTrash className="mr-2 h-4 w-4" />
                      {t("deleteProject")}
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Tasks tab — Kanban board or status-sorted list. */}
      {tab === "tasks" &&
        (view === "board" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {TASK_STATUSES.map((status) => (
                <Column
                  key={status}
                  status={status}
                  tasks={columns[status]}
                  canEdit={canEdit}
                  onAddTask={() =>
                    setTaskDialog({ open: true, task: null, status })
                  }
                  onOpenTask={(task) =>
                    setTaskDialog({ open: true, task, status: task.status })
                  }
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("taskTitle")}</TableHead>
                  <TableHead>{t("taskStatus")}</TableHead>
                  <TableHead>{t("priority")}</TableHead>
                  <TableHead>{t("dueDate")}</TableHead>
                  <TableHead>{t("assignees")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {t("noTasks")}
                    </TableCell>
                  </TableRow>
                ) : (
                  allTasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className={cn(
                        "cursor-pointer",
                        task.status === "DONE" && "opacity-60"
                      )}
                      onClick={() =>
                        setTaskDialog({
                          open: true,
                          task,
                          status: task.status,
                        })
                      }
                    >
                      <TableCell>
                        <div className="font-semibold">{task.title}</div>
                        {task.description && (
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {task.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={TASK_STATUS_VARIANT[task.status]}>
                          {t(`taskStatus_${task.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                            PRIORITY_CLASS[task.priority]
                          )}
                        >
                          {t(`priority_${task.priority}`)}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {task.dueDate
                          ? format(new Date(task.dueDate), "dd. MMM yyyy", {
                              locale: de,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {task.assignees.length > 0 ? (
                          <div className="flex -space-x-2">
                            {task.assignees.slice(0, 4).map((a) => (
                              <Avatar
                                key={a.id}
                                className="h-6 w-6 border border-background"
                              >
                                <AvatarFallback className="text-[10px]">
                                  {membershipInitials(a.membership)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ))}

      {/* Members tab — inline panel with the member list. */}
      {tab === "members" && (
        <div className="max-w-2xl rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">{t("members")}</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMembersOpen(true)}
            >
              {t("manageMembers")}
            </Button>
          </div>
          <div className="divide-y">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[11px] font-semibold">
                    {membershipInitials(member.membership)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium">
                  {membershipName(member.membership)}
                </span>
                <Badge
                  variant={member.role === "OWNER" ? "accent" : "outline"}
                >
                  {t(`role_${member.role}`)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protocols tab — protocols of this project (read-only list). */}
      {tab === "protocols" &&
        (protocolsLoading || protocols === null ? (
          <p className="text-sm text-muted-foreground">{tc("loading")}</p>
        ) : protocols.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noProjectProtocols")}
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tp("title")}</TableHead>
                  <TableHead>{tp("meetingDate")}</TableHead>
                  <TableHead>{tp("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {protocols.map((protocol) => (
                  <TableRow
                    key={protocol.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        ROUTES.admin.protocolEditor(locale, protocol.id)
                      )
                    }
                  >
                    <TableCell className="font-medium">
                      {protocol.title}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {protocol.meetingDate
                        ? format(
                            new Date(protocol.meetingDate),
                            "dd. MMM yyyy",
                            { locale: de }
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          protocol.status === "FINALIZED" ? "green" : "slate"
                        }
                      >
                        {tp(`status_${protocol.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}

      {/* Dialogs */}
      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(open) =>
          setTaskDialog((prev) => ({ ...prev, open }))
        }
        projectId={project.id}
        task={taskDialog.task}
        defaultStatus={taskDialog.status}
        memberOptions={memberOptions}
        canEdit={canEdit}
      />
      <ProjectMembersDialog
        open={membersOpen}
        onOpenChange={setMembersOpen}
        project={project}
        orgMemberships={orgMemberships}
        canManage={canManage}
      />
      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        project={project}
      />
      <SaveAsTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        projectId={project.id}
        defaultTitle={project.title}
      />
    </div>
  );
}

function Column({
  status,
  tasks,
  canEdit,
  onAddTask,
  onOpenTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  canEdit: boolean;
  onAddTask: () => void;
  onOpenTask: (task: Task) => void;
}) {
  const t = useTranslations("Projects");
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-muted/30 p-3",
        isOver && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {t(`taskStatus_${status}`)}
          <span className="ml-1 text-muted-foreground">({tasks.length})</span>
        </h2>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onAddTask}
          >
            <IconPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-12 flex-col gap-2">
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              disabled={!canEdit}
              onClick={() => onOpenTask(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTask({
  task,
  disabled,
  onClick,
}: {
  task: Task;
  disabled: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("cursor-pointer", isDragging && "opacity-50")}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  );
}
