"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const AUTO_EXPAND_MAX = 3;

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";

import {
  EMPTY_OBSERVATION,
  isObservationEmpty,
  type ClassroomStudentDTO,
  type LessonRecordObservation,
} from "../types";
import { ObservationBadgeRow } from "./ObservationBadgeRow";

type Props = {
  selectedStudents: ClassroomStudentDTO[];
  overrides: Record<string, LessonRecordObservation>;
  onChange: (next: Record<string, LessonRecordObservation>) => void;
  notes: Record<string, string>;
  onNotesChange: (next: Record<string, string>) => void;
};

export const PerChildObservationAccordion = ({
  selectedStudents,
  overrides,
  onChange,
  notes,
  onNotesChange,
}: Props) => {
  const t = useTranslations("RecordKeeping");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  // Auto-expand all sections when only a few children are selected.
  // We re-sync whenever the selection set itself changes; manual toggles
  // between selection changes are preserved.
  const lastSelectionKey = useRef<string>("");
  useEffect(() => {
    const key = selectedStudents
      .map((s) => s.studentId)
      .slice()
      .sort()
      .join(",");
    if (key === lastSelectionKey.current) return;
    lastSelectionKey.current = key;
    if (
      selectedStudents.length > 0 &&
      selectedStudents.length <= AUTO_EXPAND_MAX
    ) {
      setOpenIds(new Set(selectedStudents.map((s) => s.studentId)));
    }
  }, [selectedStudents]);

  if (selectedStudents.length === 0) return null;

  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const setOverride = (
    studentId: string,
    nextObs: LessonRecordObservation,
  ) => {
    if (isObservationEmpty(nextObs)) {
      // Clearing all badges removes the override entirely.
      const { [studentId]: _drop, ...rest } = overrides;
      onChange(rest);
      return;
    }
    onChange({ ...overrides, [studentId]: nextObs });
  };

  const setNote = (studentId: string, value: string) => {
    const trimmed = value.trimStart();
    if (trimmed.length === 0) {
      const { [studentId]: _drop, ...rest } = notes;
      onNotesChange(rest);
      return;
    }
    onNotesChange({ ...notes, [studentId]: value });
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">
          {t("observationPerChildTitle")}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("observationPerChildHelp")}
        </span>
      </div>

      <ul className="flex flex-col divide-y">
        {selectedStudents.map((s) => {
          const isOpen = openIds.has(s.studentId);
          const override = overrides[s.studentId];
          const note = notes[s.studentId] ?? "";
          const hasNote = note.trim().length > 0;
          const hasObsOverride = !!override && !isObservationEmpty(override);
          const hasOverride = hasObsOverride || hasNote;

          return (
            <li key={s.studentId} className="py-2">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleOpen(s.studentId)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition hover:bg-accent"
              >
                <StudentAvatar
                  studentId={s.studentId}
                  firstName={s.firstName}
                  lastName={s.lastName}
                  className="h-8 w-8 text-xs"
                />
                <span className="flex-1 truncate text-sm">
                  {s.firstName} {s.lastName}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    hasOverride
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {hasOverride
                    ? t("observationOverride")
                    : t("observationInherited")}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {isOpen && (
                <div className="mt-2 flex flex-col gap-3 pl-11 pr-2">
                  <ObservationBadgeRow
                    compact
                    hideTeacherSelf
                    value={override ?? EMPTY_OBSERVATION}
                    onChange={(next) => setOverride(s.studentId, next)}
                  />
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`per-child-note-${s.studentId}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {t("observationPerChildNoteLabel")}
                    </Label>
                    <Textarea
                      id={`per-child-note-${s.studentId}`}
                      value={note}
                      onChange={(e) => setNote(s.studentId, e.target.value)}
                      placeholder={t("observationPerChildNotePlaceholder")}
                      rows={2}
                      maxLength={2000}
                    />
                  </div>
                  {hasOverride && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="self-end text-xs"
                      onClick={() => {
                        setOverride(s.studentId, EMPTY_OBSERVATION);
                        setNote(s.studentId, "");
                      }}
                    >
                      {t("observationClear")}
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
