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
import {
  IconArchive,
  IconArchiveOff,
  IconDotsVertical,
  IconPlus,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { cn } from "@/lib/utils";

import { archiveProjectAction } from "../actions/archive-project.action";
import { deleteProjectAction } from "../actions/delete-project.action";
import { moveTaskAction } from "../actions/manage-tasks.action";
import { membershipName } from "../lib/membership-name";
import {
  TASK_STATUSES,
  type MembershipRef,
  type ProjectDetail,
  type ProjectStatus,
  type Task,
  type TaskStatus,
} from "../types";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { ProjectMembersDialog } from "./ProjectMembersDialog";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";

type Columns = Record<TaskStatus, Task[]>;

const STATUS_VARIANT: Record<
  ProjectStatus,
  "default" | "secondary" | "outline"
> = { ACTIVE: "default", ON_HOLD: "secondary", COMPLETED: "outline" };

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

  const [membersOpen, setMembersOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [taskDialog, setTaskDialog] = React.useState<{
    open: boolean;
    task: Task | null;
    status: TaskStatus;
  }>({ open: false, task: null, status: "OPEN" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const memberOptions = project.members
    .map((m) => m.membership)
    .filter((m): m is MembershipRef => !!m)
    .map((m) => ({ value: m.id, label: membershipName(m) }));

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

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMembersOpen(true)}
          >
            <IconUsers className="mr-1 h-4 w-4" />
            {t("members")} ({project.members.length})
          </Button>
          {canEdit && (
            <Button
              size="sm"
              onClick={() =>
                setTaskDialog({ open: true, task: null, status: "OPEN" })
              }
            >
              <IconPlus className="mr-1 h-4 w-4" />
              {t("newTask")}
            </Button>
          )}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  {t("editProject")}
                </DropdownMenuItem>
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

      {/* Board */}
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
