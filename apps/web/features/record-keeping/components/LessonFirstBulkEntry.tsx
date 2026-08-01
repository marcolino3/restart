"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PageHead } from "@/components/common/PageHead";
import { BackButton } from "@/components/common/BackButton";
import { ViewSwitcher, usePersistedView } from "@/components/common/ViewSwitcher";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { ROUTES } from "@/constants/routes";

import { createLessonRecordsBulkAction } from "../actions/create-lesson-records-bulk.action";
import { getClassroomStudentsAction } from "../actions/get-classroom-students.action";
import {
  lessonRecordsBulkSchema,
  type LessonRecordsBulkFormValues,
} from "../schemas/lesson-records-bulk.schema";
import {
  LESSON_RECORD_STATUSES,
  type ClassroomStudentDTO,
  type CurriculumNodeType,
  type LessonAncestor,
  type LessonOption,
  type LessonRecordStatus,
} from "../types";
import { STATUS_DOT_CLS } from "../lib/status-dot-cls";
import { LessonCombobox } from "./LessonCombobox";
import { RecordKeepingClassPicker } from "./RecordKeepingClassPicker";
import { RecordEntrySummaryCard } from "./RecordEntrySummaryCard";
import { RecentRecordsCard } from "./RecentRecordsCard";
import { RecordAttachmentsBlock } from "./RecordAttachmentsBlock";

const pickName = (
  translations: { locale: string; name: string }[],
  locale: string,
): string => {
  const normalized = locale.toUpperCase();
  return (
    translations.find((t) => t.locale === normalized)?.name ??
    translations[0]?.name ??
    "—"
  );
};

const findAncestor = (
  lesson: LessonOption,
  type: CurriculumNodeType,
): LessonAncestor | undefined =>
  lesson.ancestors?.find((a) => a.nodeType === type);

const DURATION_OPTIONS_MIN = [5, 10, 15, 20, 30, 45, 60, 90];
const FORM_ID = "lesson-first-bulk-entry-form";
const STUDENT_VIEWS = ["cards", "search"] as const;
type StudentView = (typeof STUDENT_VIEWS)[number];

interface Props {
  lessons: LessonOption[];
  classes: { id: string; name: string }[];
}

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const LessonFirstBulkEntry = ({ lessons, classes }: Props) => {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolClassId = searchParams.get("classId") ?? "";
  const [isPending, startTransition] = useTransition();
  const [students, setStudents] = useState<ClassroomStudentDTO[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentView, setStudentView] = usePersistedView<StudentView>(
    "record-keeping-student-view",
    STUDENT_VIEWS,
    "cards",
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [recentRefreshKey, setRecentRefreshKey] = useState(0);

  const form = useForm<LessonRecordsBulkFormValues>({
    resolver: zodResolver(lessonRecordsBulkSchema),
    defaultValues: {
      lessonId: "",
      studentIds: [],
      recordedAt: todayISO(),
      status: "INTRODUCED",
      durationMinutes: null,
      note: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() returns non-memoizable functions by design
  const studentIds = form.watch("studentIds");
  const recordedAt = form.watch("recordedAt");
  const lessonId = form.watch("lessonId");
  const status = form.watch("status") as LessonRecordStatus;

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === lessonId) ?? null,
    [lessons, lessonId],
  );
  const selectedLessonName = selectedLesson
    ? pickName(selectedLesson.translations, locale)
    : null;
  const selectedAreaName = selectedLesson
    ? (() => {
        const area = findAncestor(selectedLesson, "AREA");
        return area ? pickName(area.translations, locale) : null;
      })()
    : null;

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

  const selectWholeClass = () => {
    form.setValue(
      "studentIds",
      students.map((s) => s.studentId),
      { shouldValidate: true },
    );
  };

  const clearSelection = () => {
    form.setValue("studentIds", [], { shouldValidate: true });
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

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q),
    );
  }, [students, studentSearch]);

  const selectedClassName =
    classes.find((c) => c.id === schoolClassId)?.name ?? null;
  const formattedRecordedAt = useMemo(() => {
    const iso =
      typeof recordedAt === "string"
        ? recordedAt
        : recordedAt
          ? new Date(recordedAt).toISOString().slice(0, 10)
          : null;
    if (!iso) return null;
    try {
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(`${iso}T00:00:00`));
    } catch {
      return iso;
    }
  }, [recordedAt, locale]);

  const subtitleParts = [
    selectedClassName,
    t("childrenCount", { count: students.length }),
    formattedRecordedAt,
  ].filter(Boolean);

  const cancelHref = schoolClassId
    ? `${ROUTES.admin.recordKeepingStudents(locale)}?classId=${schoolClassId}`
    : ROUTES.admin.recordKeepingStudents(locale);

  const onSubmit = (values: LessonRecordsBulkFormValues) => {
    startTransition(async () => {
      const recordedAtIso =
        typeof values.recordedAt === "string"
          ? values.recordedAt
          : new Date(values.recordedAt).toISOString().slice(0, 10);

      const res = await createLessonRecordsBulkAction(
        {
          lessonId: values.lessonId,
          studentIds: values.studentIds,
          recordedAt: recordedAtIso,
          status: values.status as LessonRecordStatus,
          durationMinutes: values.durationMinutes ?? null,
          note: values.note?.trim() ? values.note : null,
        },
        schoolClassId,
      );

      if (!res.success) {
        toast.error(t("recordsCreateError"), { description: res.error });
        return;
      }

      toast.success(t("recordsCreated", { count: res.data.length }));
      form.setValue("studentIds", []);
      form.setValue("note", "");
      setRecentRefreshKey((k) => k + 1);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <BackButton href={cancelHref} label={t("backToRecording")} />

      <PageHead
        title={t("title")}
        subtitle={
          subtitleParts.length > 0 ? subtitleParts.join(" · ") : t("subtitle")
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(cancelHref)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" form={FORM_ID} disabled={isPending}>
              {isPending ? t("submitting") : t("recordAction")}
            </Button>
          </div>
        }
      />

      <RecordKeepingClassPicker classes={classes} />

      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start"
        >
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("cardLessonTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <LessonCombobox
                  name="lessonId"
                  lessons={lessons}
                  label={t("lesson")}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <DatePickerFormField
                    name="recordedAt"
                    label="date"
                    namespace="RecordKeeping"
                    disabledDate={() => false}
                  />
                  <FormField
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>
                          {t("duration")}{" "}
                          <span className="text-muted-foreground font-normal">
                            ({t("durationOptional")})
                          </span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? null : Number(value))
                          }
                          value={
                            field.value == null ? "none" : String(field.value)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              {t("durationNone")}
                            </SelectItem>
                            {DURATION_OPTIONS_MIN.map((m) => (
                              <SelectItem key={m} value={String(m)}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <CardTitle>{t("cardChildrenTitle")}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("cardChildrenDescription")}
                  </p>
                </div>
                <Badge variant="secondary">{studentIds.length}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ViewSwitcher
                  value={studentView}
                  onChange={setStudentView}
                  label={t("students")}
                  options={[
                    { value: "cards", label: t("viewCards") },
                    { value: "search", label: t("viewSearch") },
                  ]}
                />

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
                ) : studentView === "cards" ? (
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
                              checked &&
                                "ring-2 ring-primary ring-offset-2 ring-offset-card",
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
                ) : (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder={t("searchStudentsPlaceholder")}
                    />
                    {filteredStudents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("noStudentsFound")}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {filteredStudents.map((s) => {
                          const checked = studentIds.includes(s.studentId);
                          return (
                            <li key={s.studentId}>
                              <button
                                type="button"
                                aria-pressed={checked}
                                onClick={() => toggleStudent(s.studentId)}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-md border bg-card px-3 py-2 text-left text-sm transition hover:bg-accent",
                                  checked
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-border",
                                )}
                              >
                                <StudentAvatar
                                  studentId={s.studentId}
                                  firstName={s.firstName}
                                  lastName={s.lastName}
                                  className="h-8 w-8"
                                />
                                <span className="flex-1 truncate">
                                  <span className="font-medium">
                                    {s.firstName}
                                  </span>{" "}
                                  <span className="text-muted-foreground">
                                    {s.lastName}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
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
              </CardContent>
              {students.length > 0 && (
                <div className="flex items-center justify-between gap-2 border-t px-6 py-3">
                  <span className="text-sm text-muted-foreground">
                    {t("selectedOfTotal", {
                      selected: studentIds.length,
                      total: students.length,
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectWholeClass}
                    >
                      {t("selectWholeClass")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                    >
                      {t("clearSelection")}
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("cardStatusTitle")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("cardStatusDescription")}
                </p>
              </CardHeader>
              <CardContent>
                <SelectFormField
                  name="status"
                  label="status"
                  namespace="RecordKeeping"
                  options={statusOptions}
                  translateOptions={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("cardObservationTitle")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("cardObservationDescription")}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
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

                <RecordAttachmentsBlock />
              </CardContent>
            </Card>

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
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-6">
            <RecordEntrySummaryCard
              areaName={selectedAreaName}
              lessonName={selectedLessonName}
              formattedDate={formattedRecordedAt}
              studentCount={studentIds.length}
              status={status}
            />
            <RecentRecordsCard
              refreshKey={recentRefreshKey}
              onSelect={(id) =>
                form.setValue("lessonId", id, { shouldValidate: true })
              }
            />
          </div>
        </form>
      </Form>
    </div>
  );
};
