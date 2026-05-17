"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { ComboboxFormFieldWithoutTranslation } from "@/components/form/form-fields/ComboboxFormFieldWithoutTranslation";
import { SelectFormFieldWithoutTranslations } from "@/components/form/form-fields/SelectFormFieldWithoutTranslations";

import { createLessonRecordsBulkAction } from "../actions/create-lesson-records-bulk.action";
import { getClassroomStudentsAction } from "../actions/get-classroom-students.action";
import {
  lessonRecordsBulkSchema,
  type LessonRecordsBulkFormValues,
} from "../schemas/lesson-records-bulk.schema";
import {
  LESSON_RECORD_STATUSES,
  type ClassroomStudentDTO,
  type LessonOption,
  type LessonRecordStatus,
} from "../types";

type SchoolClassOption = { id: string; name: string };

interface Props {
  lessons: LessonOption[];
  classrooms: SchoolClassOption[];
}

const pickName = (lesson: LessonOption, locale: string): string => {
  const normalized = locale.toUpperCase();
  return (
    lesson.translations.find((t) => t.locale === normalized)?.name ??
    lesson.translations[0]?.name ??
    lesson.id
  );
};

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const LessonFirstBulkEntry = ({ lessons, classrooms }: Props) => {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [students, setStudents] = useState<ClassroomStudentDTO[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const form = useForm<LessonRecordsBulkFormValues>({
    resolver: zodResolver(lessonRecordsBulkSchema),
    defaultValues: {
      lessonId: "",
      schoolClassId: "",
      studentIds: [],
      recordedAt: todayISO(),
      status: "INTRODUCED",
      note: "",
    },
  });

  const schoolClassId = form.watch("schoolClassId");
  const studentIds = form.watch("studentIds");

  const lessonOptions = useMemo(
    () =>
      lessons.map((l) => ({
        value: l.id,
        label: pickName(l, locale),
      })),
    [lessons, locale],
  );

  const classroomOptions = useMemo(
    () =>
      classrooms.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [classrooms],
  );

  const statusOptions = useMemo(
    () =>
      LESSON_RECORD_STATUSES.map((s) => ({
        value: s,
        label: t(s),
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

      const res = await createLessonRecordsBulkAction({
        lessonId: values.lessonId,
        studentIds: values.studentIds,
        recordedAt: recordedAtIso,
        status: values.status as LessonRecordStatus,
        note: values.note?.trim() ? values.note : null,
      });
      if (res.success) {
        toast.success(t("recordsCreated", { count: res.data.length }));
        form.setValue("studentIds", []);
        form.setValue("note", "");
      } else {
        toast.error(t("recordsCreateError"), { description: res.error });
      }
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ComboboxFormFieldWithoutTranslation
                name="lessonId"
                label="lesson"
                placeholder="selectLesson"
                searchPlaceholder="searchLessons"
                emptyText="noLessonsFound"
                namespace="RecordKeeping"
                options={lessonOptions}
                width="w-full"
                clearable
              />

              <ComboboxFormFieldWithoutTranslation
                name="schoolClassId"
                label="classroom"
                placeholder="selectClassroom"
                searchPlaceholder="selectClassroom"
                emptyText="noStudentsInClassroom"
                namespace="RecordKeeping"
                options={classroomOptions}
                width="w-full"
                clearable
              />
            </div>

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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {students.map((s) => {
                    const checked = studentIds.includes(s.studentId);
                    return (
                      <label
                        key={s.studentId}
                        className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 cursor-pointer hover:bg-accent"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleStudent(s.studentId)}
                        />
                        <span className="text-sm">
                          {s.firstName} {s.lastName}
                        </span>
                      </label>
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
