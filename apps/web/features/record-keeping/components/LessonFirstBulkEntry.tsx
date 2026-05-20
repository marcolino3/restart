"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { SelectFormFieldWithoutTranslations } from "@/components/form/form-fields/SelectFormFieldWithoutTranslations";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";

import { createLessonRecordsBulkAction } from "../actions/create-lesson-records-bulk.action";
import { getClassroomStudentsAction } from "../actions/get-classroom-students.action";
import { updateLessonRecordAction } from "../actions/update-lesson-record.action";
import {
  lessonRecordsBulkSchema,
  type LessonRecordsBulkFormValues,
} from "../schemas/lesson-records-bulk.schema";
import {
  EMPTY_OBSERVATION,
  LESSON_RECORD_STATUSES,
  type ClassroomStudentDTO,
  type LessonOption,
  type LessonRecordObservation,
  type LessonRecordStatus,
} from "../types";
import { ObservationBadgeRow } from "./ObservationBadgeRow";
import { PerChildObservationAccordion } from "./PerChildObservationAccordion";

const STATUS_DOT_CLS: Record<LessonRecordStatus, string> = {
  PLANNING: "bg-slate-400",
  INTRODUCED: "bg-sky-500",
  PRACTICED: "bg-amber-500",
  MASTERED: "bg-emerald-500",
  NEEDS_MORE: "bg-rose-500",
};
import { LessonCombobox } from "./LessonCombobox";

interface Props {
  lessons: LessonOption[];
}

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const LessonFirstBulkEntry = ({ lessons }: Props) => {
  const t = useTranslations("RecordKeeping");
  const searchParams = useSearchParams();
  const schoolClassId = searchParams.get("classId") ?? "";
  const [isPending, startTransition] = useTransition();
  const [students, setStudents] = useState<ClassroomStudentDTO[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const form = useForm<LessonRecordsBulkFormValues>({
    resolver: zodResolver(lessonRecordsBulkSchema),
    defaultValues: {
      lessonId: "",
      studentIds: [],
      recordedAt: todayISO(),
      status: "INTRODUCED",
      note: "",
      observation: EMPTY_OBSERVATION,
      perChildObservations: {},
      perChildNotes: {},
    },
  });

  const studentIds = form.watch("studentIds");
  const observation =
    (form.watch("observation") as LessonRecordObservation | undefined) ??
    EMPTY_OBSERVATION;
  const perChildObservations =
    (form.watch("perChildObservations") as
      | Record<string, LessonRecordObservation>
      | undefined) ?? {};
  const perChildNotes =
    (form.watch("perChildNotes") as Record<string, string> | undefined) ?? {};
  const selectedStudents = useMemo(
    () => students.filter((s) => studentIds.includes(s.studentId)),
    [students, studentIds],
  );

  const statusOptions = useMemo(
    () =>
      LESSON_RECORD_STATUSES.map((s) => ({
        value: s,
        label: (
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0",
                STATUS_DOT_CLS[s],
              )}
            />
            <span>{t(s)}</span>
          </span>
        ),
      })),
    [t],
  );

  useEffect(() => {
    if (!schoolClassId) {
      setStudents([]);
      form.setValue("studentIds", []);
      return;
    }
    let cancelled = false;
    setLoadingStudents(true);
    getClassroomStudentsAction(schoolClassId)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setStudents(res.data);
          form.setValue("studentIds", []);
        } else {
          setStudents([]);
          toast.error(res.error ?? "Failed to load students");
        }
      })
      .finally(() => !cancelled && setLoadingStudents(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolClassId]);

  const allSelected =
    students.length > 0 && students.every((s) => studentIds.includes(s.studentId));
  const toggleAll = () => {
    form.setValue(
      "studentIds",
      allSelected ? [] : students.map((s) => s.studentId),
      { shouldValidate: true },
    );
  };

  const toggleStudent = (studentId: string) => {
    const current = studentIds ?? [];
    form.setValue(
      "studentIds",
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
      { shouldValidate: true },
    );
  };

  const onSubmit = (values: LessonRecordsBulkFormValues) => {
    startTransition(async () => {
      const recordedAtIso =
        typeof values.recordedAt === "string"
          ? values.recordedAt
          : new Date(values.recordedAt).toISOString().slice(0, 10);

      const bulkObservation = values.observation as
        | LessonRecordObservation
        | undefined;
      const overrides = (values.perChildObservations ?? {}) as Record<
        string,
        LessonRecordObservation
      >;
      const noteOverrides = (values.perChildNotes ?? {}) as Record<
        string,
        string
      >;

      const res = await createLessonRecordsBulkAction(
        {
          lessonId: values.lessonId,
          studentIds: values.studentIds,
          recordedAt: recordedAtIso,
          status: values.status as LessonRecordStatus,
          note: values.note?.trim() ? values.note : null,
          observation: bulkObservation ?? null,
        },
        schoolClassId,
      );

      if (!res.success) {
        toast.error(t("recordsCreateError"), { description: res.error });
        return;
      }

      // Apply per-child overrides as individual updates against the just-
      // created records. Best-effort: report partial failures via toast,
      // never block the success of the bulk-create itself.
      const obsHasValues = (obs: LessonRecordObservation | undefined) =>
        !!obs && Object.values(obs).some((v) => v != null && v !== false);
      const overrideStudentIds = new Set<string>([
        ...Object.entries(overrides)
          .filter(([, obs]) => obsHasValues(obs))
          .map(([sid]) => sid),
        ...Object.entries(noteOverrides)
          .filter(([, note]) => (note ?? "").trim().length > 0)
          .map(([sid]) => sid),
      ]);
      if (overrideStudentIds.size > 0) {
        const byStudent = new Map(res.data.map((r) => [r.studentId, r.id]));
        const results = await Promise.all(
          Array.from(overrideStudentIds).map((sid) => {
            const recordId = byStudent.get(sid);
            if (!recordId) return Promise.resolve({ success: false } as const);
            const obs = overrides[sid];
            const note = noteOverrides[sid]?.trim();
            return updateLessonRecordAction(
              {
                id: recordId,
                ...(obsHasValues(obs) ? { observation: obs } : {}),
                ...(note ? { note } : {}),
              },
              schoolClassId,
            );
          }),
        );
        const failed = results.filter((r) => !r.success).length;
        if (failed === 0) {
          toast.success(
            t("observationOverridesAppliedToast"),
          );
        } else {
          toast.warning(t("observationOverridesPartialFailureToast"), {
            description: `${failed}/${overrideStudentIds.size}`,
          });
        }
      }

      toast.success(t("recordsCreated", { count: res.data.length }));
      form.setValue("studentIds", []);
      form.setValue("note", "");
      form.setValue("perChildObservations", {});
      form.setValue("perChildNotes", {});
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <LessonCombobox
              name="lessonId"
              lessons={lessons}
              label={t("lesson")}
            />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t("students")}</Label>
                {students.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleAll}
                  >
                    {allSelected ? t("deselectAllStudents") : t("selectAllStudents")}
                  </Button>
                )}
              </div>
              {!schoolClassId ? (
                <p className="text-sm text-muted-foreground">
                  {t("selectClassroomFirst")}
                </p>
              ) : loadingStudents ? (
                <p className="text-sm text-muted-foreground">…</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noStudentsInClassroom")}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {students.map((s) => {
                    const checked = studentIds.includes(s.studentId);
                    return (
                      <button
                        key={s.studentId}
                        type="button"
                        aria-pressed={checked}
                        onClick={() => toggleStudent(s.studentId)}
                        className={cn(
                          "group flex flex-col items-center gap-2 rounded-lg border bg-card px-2 py-3 text-center transition hover:bg-accent",
                          checked
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border",
                        )}
                      >
                        <StudentAvatar
                          studentId={s.studentId}
                          firstName={s.firstName}
                          lastName={s.lastName}
                          className={cn(
                            "h-16 w-16 text-base",
                            checked && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                          )}
                        />
                        <span className="w-full text-sm font-medium leading-tight break-words">
                          {s.firstName}
                        </span>
                        <span className="w-full text-sm leading-tight text-muted-foreground break-words">
                          {s.lastName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {form.formState.errors.studentIds && (
                <p className="text-sm text-destructive">
                  {t(
                    form.formState.errors.studentIds.message as
                      | "selectAtLeastOneStudent"
                      | "selectClassroomFirst",
                  )}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectFormFieldWithoutTranslations
                name="status"
                label={t("status")}
                options={statusOptions}
              />

              <DatePickerFormField
                name="recordedAt"
                label="date"
                namespace="RecordKeeping"
                disabledDate={() => false}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="note" className="text-sm font-medium">
                {t("note")}
              </Label>
              <Textarea
                id="note"
                {...form.register("note")}
                placeholder={t("notePlaceholder")}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-0.5">
                <Label className="text-sm font-medium">
                  {t("observationSectionTitle")}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {t("observationDefaultHelp")}
                </span>
              </div>
              <ObservationBadgeRow
                collapsibleChildren
                value={observation}
                onChange={(next) =>
                  form.setValue("observation", next, { shouldDirty: true })
                }
              />
            </div>

            {selectedStudents.length > 0 && (
              <PerChildObservationAccordion
                selectedStudents={selectedStudents}
                overrides={perChildObservations}
                onChange={(next) =>
                  form.setValue("perChildObservations", next, {
                    shouldDirty: true,
                  })
                }
                notes={perChildNotes}
                onNotesChange={(next) =>
                  form.setValue("perChildNotes", next, {
                    shouldDirty: true,
                  })
                }
              />
            )}

            {/* Generisches Form-Error-Display fuer das Falle, dass eine Field
                ohne sichtbares Error-Element fehlschlaegt (z.B. lessonId-Combobox). */}
            {Object.keys(form.formState.errors).length > 0 && (
              <p className="text-sm text-destructive">
                {Object.entries(form.formState.errors)
                  .map(
                    ([k, v]) =>
                      `${k}: ${(v as { message?: string }).message ?? "invalid"}`,
                  )
                  .join(" · ")}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? t("submitting") : t("submit")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
