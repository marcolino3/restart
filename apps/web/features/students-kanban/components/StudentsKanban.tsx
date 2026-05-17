"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
import { GripVertical, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { transferStudentAction } from "../actions/transfer-student.action";
import {
  UNASSIGNED_COLUMN_ID,
  type KanbanClassroom,
  type KanbanStudent,
} from "../types";

interface Props {
  initialClassrooms: KanbanClassroom[];
  initialUnassigned: KanbanStudent[];
  initialStudentsById: Record<string, KanbanStudent>;
  gradeLevels: { id: string; name: string }[];
}

type ColumnState = {
  id: string;
  studentIds: string[];
};

const COLUMN_MIN_HEIGHT = "min-h-[200px]";

export function StudentsKanban({
  initialClassrooms,
  initialUnassigned,
  initialStudentsById,
  gradeLevels,
}: Props) {
  const t = useTranslations("StudentsKanban");
  const [, startTransition] = useTransition();

  const [studentsById, setStudentsById] = useState<
    Record<string, KanbanStudent>
  >(initialStudentsById);
  const [columns, setColumns] = useState<Record<string, ColumnState>>(() => {
    const map: Record<string, ColumnState> = {
      [UNASSIGNED_COLUMN_ID]: {
        id: UNASSIGNED_COLUMN_ID,
        studentIds: initialUnassigned.map((s) => s.id),
      },
    };
    for (const c of initialClassrooms) {
      map[c.id] = { id: c.id, studentIds: [...c.studentIds] };
    }
    return map;
  });
  const [classroomMeta] = useState<KanbanClassroom[]>(initialClassrooms);

  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeStudent, setActiveStudent] = useState<KanbanStudent | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const visibleClassrooms = useMemo(() => {
    if (selectedGradeIds.length === 0) return classroomMeta;
    const sel = new Set(selectedGradeIds);
    return classroomMeta.filter((c) =>
      c.gradeLevelIds.some((id) => sel.has(id)),
    );
  }, [classroomMeta, selectedGradeIds]);

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

  const onDragStart = (e: DragStartEvent) => {
    const studentId = String(e.active.id);
    setActiveStudent(studentsById[studentId] ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveStudent(null);
    const { active, over } = e;
    if (!over) return;

    const studentId = String(active.id);
    let toColumnId = String(over.id);
    // Wenn auf einer Student-Card abgelegt: deren Spalte ermitteln
    if (!columns[toColumnId]) {
      const owner = findColumnForStudent(toColumnId);
      if (!owner) return;
      toColumnId = owner;
    }

    const fromColumnId = findColumnForStudent(studentId);
    if (!fromColumnId) return;
    if (fromColumnId === toColumnId) return; // no-op

    // Capacity-Soft-Warn
    const target = classroomMeta.find((c) => c.id === toColumnId);
    if (target?.maxCapacity != null) {
      const futureCount = columns[toColumnId].studentIds.length + 1;
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

    // Optimistic update
    setColumns((prev) => {
      const next: Record<string, ColumnState> = { ...prev };
      next[fromColumnId] = {
        ...prev[fromColumnId],
        studentIds: prev[fromColumnId].studentIds.filter((id) => id !== studentId),
      };
      next[toColumnId] = {
        ...prev[toColumnId],
        studentIds: [...prev[toColumnId].studentIds, studentId].sort((a, b) => {
          const sa = studentsById[a];
          const sb = studentsById[b];
          if (!sa || !sb) return 0;
          return `${sa.lastName} ${sa.firstName}`.localeCompare(
            `${sb.lastName} ${sb.firstName}`,
          );
        }),
      };
      return next;
    });

    startTransition(async () => {
      const res = await transferStudentAction({
        studentId,
        targetSchoolClassId:
          toColumnId === UNASSIGNED_COLUMN_ID ? null : toColumnId,
      });
      if (!res.success) {
        // Rollback
        setColumns((prev) => {
          const next: Record<string, ColumnState> = { ...prev };
          next[toColumnId] = {
            ...prev[toColumnId],
            studentIds: prev[toColumnId].studentIds.filter(
              (id) => id !== studentId,
            ),
          };
          next[fromColumnId] = {
            ...prev[fromColumnId],
            studentIds: [...prev[fromColumnId].studentIds, studentId],
          };
          return next;
        });
        toast.error(t("transferError"), { description: res.error });
      } else {
        toast.success(t("transferOk"));
      }
    });
  };

  const toggleGrade = (id: string) =>
    setSelectedGradeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // Avoid unused-var TS warning until lookup helper is wired elsewhere
  void setStudentsById;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("searchStudent")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        {gradeLevels.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{t("filterByGrade")}</span>
            {gradeLevels.map((g) => {
              const selected = selectedGradeIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGrade(g.id)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md border transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-accent",
                  )}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Unassigned column first */}
          <KanbanColumn
            id={UNASSIGNED_COLUMN_ID}
            title={t("unassigned")}
            students={(columns[UNASSIGNED_COLUMN_ID]?.studentIds ?? [])
              .filter(matchesSearch)
              .map((id) => studentsById[id])
              .filter(Boolean)}
            count={columns[UNASSIGNED_COLUMN_ID]?.studentIds.length ?? 0}
            highlight
          />
          {visibleClassrooms.map((c) => {
            const ids = columns[c.id]?.studentIds ?? [];
            return (
              <KanbanColumn
                key={c.id}
                id={c.id}
                title={c.name}
                color={c.color}
                count={ids.length}
                maxCapacity={c.maxCapacity ?? null}
                students={ids
                  .filter(matchesSearch)
                  .map((id) => studentsById[id])
                  .filter(Boolean)}
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
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

interface ColumnProps {
  id: string;
  title: string;
  count: number;
  students: KanbanStudent[];
  color?: string | null;
  maxCapacity?: number | null;
  highlight?: boolean;
}

function KanbanColumn({
  id,
  title,
  count,
  students,
  color,
  maxCapacity,
  highlight,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const overCapacity =
    maxCapacity != null && count > maxCapacity;
  return (
    <Card
      className={cn(
        "flex flex-col gap-0",
        highlight && "border-dashed",
        isOver && "ring-2 ring-primary",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2 truncate">
            {color && (
              <span
                className="inline-block h-3 w-3 rounded-sm border"
                style={{ backgroundColor: color }}
              />
            )}
            <span className="truncate">{title}</span>
          </CardTitle>
          <Badge
            variant={overCapacity ? "destructive" : "secondary"}
            className="text-[10px]"
          >
            <Users className="h-3 w-3 mr-1" />
            {maxCapacity != null ? `${count}/${maxCapacity}` : count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-1.5 p-3 pt-1",
          COLUMN_MIN_HEIGHT,
          isOver && "bg-accent/50 rounded-md",
        )}
      >
        {students.length === 0 ? (
          <p className="text-xs text-muted-foreground italic mt-2">
            —
          </p>
        ) : (
          students.map((s) => <DraggableStudent key={s.id} student={s} />)
        )}
      </CardContent>
    </Card>
  );
}

function DraggableStudent({ student }: { student: KanbanStudent }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: student.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(isDragging && "opacity-30")}
    >
      <StudentCardVisual student={student} />
    </div>
  );
}

function StudentCardVisual({
  student,
  dragging,
  className,
}: {
  student: KanbanStudent;
  dragging?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm cursor-grab active:cursor-grabbing",
        dragging ? "shadow-md" : "hover:bg-accent",
        className,
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
      <span className="truncate">
        {student.firstName} {student.lastName}
      </span>
    </div>
  );
}
