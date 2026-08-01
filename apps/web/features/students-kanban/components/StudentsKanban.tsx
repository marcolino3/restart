"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Eye, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableFacetedFilter } from "@/components/common/DataTableFacetedFilter";
import { SearchInput } from "@/components/common/SearchInput";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

import { transferStudentAction } from "../actions/transfer-student.action";
import { deleteStudentAction } from "@/features/students/actions/delete-student.action";
import { handleAction } from "@/lib/actions/handle-action";
import type { KanbanGradeLevel } from "../actions/get-kanban-data.action";
import {
  UNASSIGNED_COLUMN_ID,
  type KanbanClassroom,
  type KanbanStudent,
} from "../types";

interface Props {
  initialClassrooms: KanbanClassroom[];
  initialUnassigned: KanbanStudent[];
  initialStudentsById: Record<string, KanbanStudent>;
  gradeLevels: KanbanGradeLevel[];
}

type ColumnState = {
  id: string;
  studentIds: string[];
};

/**
 * A drop target is a class, optionally narrowed to one of its subgroups.
 * Encoding both in one id keeps dnd-kit's single-id model intact; the drop
 * handler decodes it back into the two values the API needs.
 *
 * "<classId>" for the class itself, "<classId>::<gradeLevelId>" for a lane.
 */
const columnId = (classId: string, gradeLevelId?: string | null): string =>
  gradeLevelId ? `${classId}::${gradeLevelId}` : classId;

const decodeColumnId = (
  id: string,
): { classId: string; gradeLevelId: string | null } => {
  const [classId, gradeLevelId] = id.split("::");
  return { classId, gradeLevelId: gradeLevelId ?? null };
};

/**
 * Subgroups a class splits into — the children of the stages it carries.
 * A class whose stages have no children stays one undivided column.
 */
const subgroupsOf = (
  classroom: KanbanClassroom,
  gradeLevels: KanbanGradeLevel[],
): KanbanGradeLevel[] => {
  const own = new Set(classroom.gradeLevelIds);
  return gradeLevels
    .filter((g) => g.parentId != null && own.has(g.parentId))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
};

const ageFrom = (dateOfBirth?: string | null): number | null => {
  if (!dateOfBirth) return null;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
};

const byName = (
  studentsById: Record<string, KanbanStudent>,
  a: string,
  b: string,
): number => {
  const sa = studentsById[a];
  const sb = studentsById[b];
  if (!sa || !sb) return 0;
  return `${sa.lastName} ${sa.firstName}`.localeCompare(
    `${sb.lastName} ${sb.firstName}`,
  );
};

/** Splits each class's children across its subgroup lanes. */
function buildColumns(
  classrooms: KanbanClassroom[],
  unassigned: KanbanStudent[],
  gradeLevels: KanbanGradeLevel[],
): Record<string, ColumnState> {
  const map: Record<string, ColumnState> = {
    [UNASSIGNED_COLUMN_ID]: {
      id: UNASSIGNED_COLUMN_ID,
      studentIds: unassigned.map((s) => s.id),
    },
  };
  for (const c of classrooms) {
    const subgroups = subgroupsOf(c, gradeLevels);
    for (const sub of subgroups) {
      const id = columnId(c.id, sub.id);
      map[id] = {
        id,
        studentIds: c.studentIds.filter(
          (sid) => c.gradeLevelByStudentId[sid] === sub.id,
        ),
      };
    }
    // The class lane itself holds whoever is not in a subgroup.
    map[c.id] = {
      id: c.id,
      studentIds: c.studentIds.filter((sid) => {
        const assigned = c.gradeLevelByStudentId[sid];
        return !assigned || !subgroups.some((sub) => sub.id === assigned);
      }),
    };
  }
  return map;
}

export function StudentsKanban({
  initialClassrooms,
  initialUnassigned,
  initialStudentsById,
  gradeLevels,
}: Props) {
  const t = useTranslations("StudentsKanban");
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [studentsById] =
    useState<Record<string, KanbanStudent>>(initialStudentsById);
  const [columns, setColumns] = useState<Record<string, ColumnState>>(() =>
    buildColumns(initialClassrooms, initialUnassigned, gradeLevels),
  );
  const [classroomMeta] = useState<KanbanClassroom[]>(initialClassrooms);

  const [classFilter, setClassFilter] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeStudent, setActiveStudent] = useState<KanbanStudent | null>(
    null,
  );
  /** Multi-select: ⌘/Ctrl- or Shift-click gathers children, then drag once. */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const classFilterOptions = useMemo(
    () => classroomMeta.map((c) => ({ label: c.name, value: c.id })),
    [classroomMeta],
  );

  const visibleClassrooms = useMemo(() => {
    if (classFilter.length === 0) return classroomMeta;
    const sel = new Set(classFilter);
    return classroomMeta.filter((c) => sel.has(c.id));
  }, [classroomMeta, classFilter]);

  const searchLc = search.trim().toLowerCase();
  const matchesSearch = (id: string): boolean => {
    if (!searchLc) return true;
    const s = studentsById[id];
    if (!s) return false;
    return (
      s.firstName.toLowerCase().includes(searchLc) ||
      s.lastName.toLowerCase().includes(searchLc)
    );
  };

  const findColumnForStudent = (studentId: string): string | null => {
    for (const col of Object.values(columns)) {
      if (col.studentIds.includes(studentId)) return col.id;
    }
    return null;
  };

  const toggleSelected = (studentId: string) =>
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );

  const onDragStart = (e: DragStartEvent) => {
    const studentId = String(e.active.id);
    setActiveStudent(studentsById[studentId] ?? null);
    // Dragging a card outside the selection starts a fresh single move.
    if (selectedIds.length > 0 && !selectedIds.includes(studentId)) {
      setSelectedIds([]);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveStudent(null);
    const { active, over } = e;
    if (!over) return;

    const draggedId = String(active.id);
    let toColumnId = String(over.id);
    if (!columns[toColumnId]) {
      const owner = findColumnForStudent(toColumnId);
      if (!owner) return;
      toColumnId = owner;
    }

    // Everything selected moves together; otherwise just the dragged card.
    const moving = selectedIds.includes(draggedId) ? selectedIds : [draggedId];
    const origin = new Map<string, string>();
    for (const id of moving) {
      const from = findColumnForStudent(id);
      if (from) origin.set(id, from);
    }
    const actuallyMoving = moving.filter((id) => origin.get(id) !== toColumnId);
    if (actuallyMoving.length === 0) return;

    const { classId: toClassId, gradeLevelId: toGradeLevelId } =
      decodeColumnId(toColumnId);

    // Capacity counts the whole class, not the single lane.
    const target = classroomMeta.find((c) => c.id === toClassId);
    if (target?.maxCapacity != null) {
      const incoming = actuallyMoving.filter(
        (id) => decodeColumnId(origin.get(id) ?? "").classId !== toClassId,
      ).length;
      if (incoming > 0) {
        const futureCount =
          Object.entries(columns)
            .filter(([id]) => decodeColumnId(id).classId === toClassId)
            .reduce((sum, [, col]) => sum + col.studentIds.length, 0) + incoming;
        if (futureCount > target.maxCapacity) {
          toast.warning(
            t("capacityExceededWarn", {
              count: futureCount,
              max: target.maxCapacity,
              className: target.name,
            }),
          );
        }
      }
    }

    // Optimistic update
    setColumns((prev) => {
      const next: Record<string, ColumnState> = { ...prev };
      for (const id of actuallyMoving) {
        const from = origin.get(id);
        if (!from) continue;
        next[from] = {
          ...next[from],
          studentIds: next[from].studentIds.filter((sid) => sid !== id),
        };
      }
      next[toColumnId] = {
        ...next[toColumnId],
        studentIds: [...next[toColumnId].studentIds, ...actuallyMoving].sort(
          (a, b) => byName(studentsById, a, b),
        ),
      };
      return next;
    });
    setSelectedIds([]);

    startTransition(async () => {
      const results = await Promise.all(
        actuallyMoving.map((id) =>
          transferStudentAction({
            studentId: id,
            targetSchoolClassId:
              toColumnId === UNASSIGNED_COLUMN_ID ? null : toClassId,
            gradeLevelId:
              toColumnId === UNASSIGNED_COLUMN_ID ? null : toGradeLevelId,
          }),
        ),
      );
      const failed = actuallyMoving.filter((_, i) => !results[i].success);

      if (failed.length > 0) {
        // Roll back only what did not make it.
        setColumns((prev) => {
          const next: Record<string, ColumnState> = { ...prev };
          next[toColumnId] = {
            ...next[toColumnId],
            studentIds: next[toColumnId].studentIds.filter(
              (sid) => !failed.includes(sid),
            ),
          };
          for (const id of failed) {
            const from = origin.get(id);
            if (!from) continue;
            next[from] = {
              ...next[from],
              studentIds: [...next[from].studentIds, id].sort((a, b) =>
                byName(studentsById, a, b),
              ),
            };
          }
          return next;
        });
        const firstError = results.find((r) => !r.success);
        toast.error(t("transferError"), {
          description:
            firstError && !firstError.success ? firstError.error : undefined,
        });
      } else {
        toast.success(t("transferOk"));
      }
    });
  };

  const openProfile = (studentId: string) =>
    router.push(ROUTES.admin.studentsView(locale, studentId));

  // Any class split into subgroups changes how wide the columns should be.
  const hasSubgroupLanes = visibleClassrooms.some(
    (c) => subgroupsOf(c, gradeLevels).length > 0,
  );

  const laneStudents = (id: string): KanbanStudent[] =>
    (columns[id]?.studentIds ?? [])
      .filter(matchesSearch)
      .map((sid) => studentsById[sid])
      .filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder={t("searchStudent")}
          aria-label={t("searchStudent")}
          containerClassName="max-w-xs"
        />
        {classFilterOptions.length > 0 && (
          <DataTableFacetedFilter
            title={t("filterClass")}
            options={classFilterOptions}
            selected={classFilter}
            onChange={setClassFilter}
            searchPlaceholder={t("filterClassSearch")}
          />
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div
          className="grid items-start gap-3"
          style={{
            // auto-fit rather than a fixed column count: a class carrying
            // subgroups needs room for its lanes, and with a fixed count it
            // stayed 430px wide however empty the rest of the row was —
            // which is why the third lane wrapped.
            gridTemplateColumns: hasSubgroupLanes
              ? "repeat(auto-fit, minmax(min(680px, 100%), 1fr))"
              : "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          }}
        >
          {/* Only shown when somebody is actually unassigned — an empty
              column would just take room away from the classes. It also
              reappears the moment a child is dragged out of a class. */}
          {(columns[UNASSIGNED_COLUMN_ID]?.studentIds.length ?? 0) > 0 && (
            <KanbanColumn
              id={UNASSIGNED_COLUMN_ID}
              title={t("unassigned")}
              count={columns[UNASSIGNED_COLUMN_ID]?.studentIds.length ?? 0}
              students={laneStudents(UNASSIGNED_COLUMN_ID)}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelected}
              onOpen={openProfile}
              highlight
            />
          )}

          {visibleClassrooms.map((c) => {
            const subgroups = subgroupsOf(c, gradeLevels);
            const total = Object.entries(columns)
              .filter(([id]) => decodeColumnId(id).classId === c.id)
              .reduce((sum, [, col]) => sum + col.studentIds.length, 0);

            return (
              <KanbanColumn
                key={c.id}
                id={c.id}
                title={c.name}
                color={c.color}
                count={total}
                maxCapacity={c.maxCapacity ?? null}
                students={laneStudents(c.id)}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelected}
                onOpen={openProfile}
                unassignedLabel={t("withoutSubgroup")}
                distribution={subgroups.map((sub) => ({
                  label: sub.name,
                  count:
                    columns[columnId(c.id, sub.id)]?.studentIds.length ?? 0,
                }))}
                sections={subgroups.map((sub) => ({
                  id: columnId(c.id, sub.id),
                  title: sub.name,
                  students: laneStudents(columnId(c.id, sub.id)),
                  count: columns[columnId(c.id, sub.id)]?.studentIds.length ?? 0,
                }))}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeStudent ? (
            <StudentCardVisual
              student={activeStudent}
              dragging
              className="rotate-1 shadow-lg"
              // A stack reads better than a single card for a group move.
              stackCount={
                selectedIds.includes(activeStudent.id) ? selectedIds.length : 1
              }
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedIds.length > 0 && (
        <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-card border border-primary/40 bg-card px-4 py-3 shadow-sm">
          <span className="text-sm font-semibold text-primary">
            {t("selectedCount", { count: selectedIds.length })}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("selectionHint")}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setSelectedIds([])}
          >
            {t("clearSelection")}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("boardHint")}</p>
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  count: number;
  students: KanbanStudent[];
}

interface ColumnProps {
  id: string;
  title: string;
  count: number;
  students: KanbanStudent[];
  selectedIds: string[];
  onToggleSelect: (studentId: string) => void;
  onOpen: (studentId: string) => void;
  color?: string | null;
  maxCapacity?: number | null;
  highlight?: boolean;
  /** Subgroup lanes rendered inside the column, each its own drop target. */
  sections?: SectionProps[];
  /** Heading for the lane holding children not placed in any subgroup. */
  unassignedLabel?: string;
  /** Per-subgroup counts, shown next to the class name ("US1 1 · US2 2"). */
  distribution?: { label: string; count: number }[];
}

function KanbanColumn({
  id,
  title,
  count,
  students,
  selectedIds,
  onToggleSelect,
  onOpen,
  color,
  maxCapacity,
  highlight,
  sections,
  unassignedLabel,
  distribution,
}: ColumnProps) {
  const overCapacity = maxCapacity != null && count > maxCapacity;
  const lanes = sections ?? [];

  return (
    <Card
      className={cn(
        "flex flex-col gap-0",
        // "Unassigned" is the odd one out and reads as such in the design:
        // warm tint and a visible border, not just another grey card.
        highlight && "border-amber-200/70 bg-amber-50/60 dark:bg-amber-950/20",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 truncate text-base">
            {color ? (
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            ) : highlight ? (
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-600/80" />
            ) : null}
            <span className="truncate">{title}</span>
            {/* Plain count next to the name, as in the design. The capacity
                keeps its badge — it can turn into a warning. */}
            {maxCapacity == null && (
              <span className="text-sm font-normal text-muted-foreground">
                {count}
              </span>
            )}
          </CardTitle>

          {maxCapacity != null && (
            <Badge
              variant={overCapacity ? "destructive" : "secondary"}
              className="text-[10px]"
            >
              <Users className="mr-1 h-3 w-3" />
              {count}/{maxCapacity}
            </Badge>
          )}
        </div>
        {/* Distribution on its own line — squeezed next to the title it ate
            into the class name, which then truncated to "Klasse …". */}
        {distribution && distribution.length > 0 && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {distribution.map((d) => `${d.label} ${d.count}`).join(" · ")}
          </p>
        )}
      </CardHeader>

      {/* A container query, not a viewport one: whether two subgroups fit
          side by side depends on how wide this column is, and that changes
          with the number of classes on the board. */}
      <CardContent className="@container flex flex-col gap-2 p-3 pt-1">
        {lanes.length > 0 ? (
          <>
            <div
              className="grid gap-2"
              style={{
                // auto-fit over a minimum lane width: every subgroup that
                // still fits gets its own column. Fixed breakpoints left the
                // third lane below the first two even with room to spare.
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(210px, 100%), 1fr))",
              }}
            >
              {lanes.map((section) => (
                <DropLane
                  key={section.id}
                  id={section.id}
                  label={section.title}
                  count={section.count}
                  students={section.students}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  onOpen={onOpen}
                />
              ))}
            </div>
            {/* The class lane still takes children directly — whoever has not
                been placed in a subgroup yet. Labelled, or its cards read as
                belonging to the last subgroup above it. */}
            {students.length > 0 && (
              <DropLane
                id={id}
                label={unassignedLabel}
                count={students.length}
                students={students}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                onOpen={onOpen}
              />
            )}
          </>
        ) : (
          <DropLane
            id={id}
            students={students}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onOpen={onOpen}
            minHeight
          />
        )}
      </CardContent>
    </Card>
  );
}

function DropLane({
  id,
  label,
  count,
  students,
  selectedIds,
  onToggleSelect,
  onOpen,
  minHeight,
}: {
  id: string;
  label?: string;
  count?: number;
  students: KanbanStudent[];
  selectedIds: string[];
  onToggleSelect: (studentId: string) => void;
  onOpen: (studentId: string) => void;
  minHeight?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [collapsed, setCollapsed] = useState(false);
  // A collapsed lane stays collapsed while a card hovers over it. Expanding on
  // isOver looked helpful but fed back on itself: the cards appear, the lane
  // grows, the pointer is no longer over it, isOver flips false, the cards go
  // away — React gave up with "Maximum update depth exceeded". The lane still
  // accepts the drop; it just shows a landing strip instead of its contents.
  const showCards = !collapsed;

  return (
    <div>
      {label && (
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="mb-1 flex w-full items-center gap-1.5 px-0.5 text-left"
          aria-expanded={!collapsed}
        >
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
            {count ?? students.length}
          </span>
          {/* Chevron at the far end of the row: leading it pushed the label
              off the left edge the other headings line up on. */}
          {collapsed ? (
            <ChevronRight className="ml-auto size-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="ml-auto size-3 text-muted-foreground" />
          )}
        </button>
      )}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-1.5 rounded-md",
          minHeight ? "min-h-[120px]" : "min-h-[36px]",
          // Collapsed lanes keep a fixed strip so there is something to aim at.
          // Collapsed keeps a visible, droppable strip — just without the
          // wording. The counter next to the label already says how many are
          // inside, so a text would only repeat it.
          collapsed && "min-h-[32px] border border-dashed bg-muted/30",
          isOver && "bg-accent/50 ring-1 ring-primary/40",
        )}
      >
        {showCards &&
          students.map((s) => (
            <DraggableStudent
              key={s.id}
              student={s}
              selected={selectedIds.includes(s.id)}
              onToggleSelect={onToggleSelect}
              onOpen={onOpen}
            />
          ))}
      </div>
    </div>
  );
}

function DraggableStudent({
  student,
  selected,
  onToggleSelect,
  onOpen,
}: {
  student: KanbanStudent;
  selected: boolean;
  onToggleSelect: (studentId: string) => void;
  onOpen: (studentId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: student.id });

  return (
    <div
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "opacity-30")}
    >
      {/* The drag listeners cover the card body only. dnd-kit claims
          pointerdown on whatever it is attached to, so a menu trigger inside
          this element would never see the click that opens it. */}
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          // Selecting is the card's job; actions live in the ⋯ menu. A plain
          // click that navigated away made picking several children a trap.
          e.preventDefault();
          onToggleSelect(student.id);
        }}
      >
        <StudentCardVisual student={student} selected={selected} />
      </div>
      <div className="absolute top-1.5 right-1.5">
        <StudentCardMenu student={student} onOpen={onOpen} />
      </div>
    </div>
  );
}

/**
 * Per-card actions. Lives here rather than on the card body because the card
 * itself is a drag handle — anything clickable inside has to stop the pointer
 * from starting a drag.
 */
function StudentCardMenu({
  student,
  onOpen,
}: {
  student: KanbanStudent;
  onOpen: (studentId: string) => void;
}) {
  const t = useTranslations("StudentsKanban");
  const tS = useTranslations("Students");
  const locale = useLocale();
  const router = useRouter();

  // Only stop the event from reaching the card underneath — calling
  // preventDefault here would also swallow the click that opens the menu.
  const stopBubbling = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-6 shrink-0"
          aria-label={t("openMenu")}
          onPointerDown={stopBubbling}
          onClick={stopBubbling}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={stopBubbling}>
        <DropdownMenuItem onSelect={() => onOpen(student.id)}>
          <Eye className="mr-2 size-4" />
          {t("showDetails")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            router.push(ROUTES.admin.studentsEdit(locale, student.id))
          }
        >
          <Pencil className="mr-2 size-4" />
          {t("editStudent")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={async () => {
            // deleteStudent is a soft delete — it flips isActive, which is
            // exactly "deactivate" from the user's side.
            await handleAction({
              action: () => deleteStudentAction(student.id),
              successMessage: tS("studentDeleted"),
              errorMessage: tS("studentDeleteError"),
              onSuccess: () => router.refresh(),
            });
          }}
        >
          <Trash2 className="mr-2 size-4" />
          {t("deactivate")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StudentCardVisual({
  student,
  dragging,
  selected,
  className,
  stackCount = 1,
}: {
  student: KanbanStudent;
  dragging?: boolean;
  selected?: boolean;
  className?: string;
  stackCount?: number;
}) {
  const t = useTranslations("StudentsKanban");
  const locale = useLocale();
  const age = ageFrom(student.dateOfBirth);
  const born = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative">
      {stackCount > 1 && (
        <span className="absolute -top-2 -right-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
          {stackCount}
        </span>
      )}
      <div
        className={cn(
          "cursor-grab rounded-md border bg-card py-2 pr-9 pl-3 active:cursor-grabbing",
          dragging ? "shadow-md" : "hover:bg-accent/60",
          selected && "border-primary bg-primary/5 ring-1 ring-primary",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <StudentAvatar
            firstName={student.firstName}
            lastName={student.lastName}
            className="size-6 shrink-0"
            fallbackClassName="text-[10px]"
          />
          <span className="truncate text-sm font-medium">
            {student.firstName} {student.lastName}
          </span>
        </div>
        {(born || student.isActive === false) && (
          <div className="mt-1 flex items-center gap-2 pl-8">
            {born && (
              <span className="text-[11px] text-muted-foreground">
                {age != null
                  ? t("bornWithAge", { date: born, age })
                  : t("born", { date: born })}
              </span>
            )}
            {student.isActive === false && (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                {t("inactive")}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
