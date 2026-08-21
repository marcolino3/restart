"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check } from "lucide-react";

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
import { SearchInput } from "@/components/common/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { cn } from "@/lib/utils";
import { PageHead } from "@/components/common/PageHead";
import { BackButton } from "@/components/common/BackButton";
import { DateTimeCalendarFormField } from "@/components/form/form-fields/DateTimeCalendarFormField";
import { useUser } from "@/features/users/context/current-user.context";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { ROUTES } from "@/constants/routes";

import { createLessonRecordsBulkAction } from "../actions/create-lesson-records-bulk.action";
import { updateLessonRecordsGroupAction } from "../actions/update-lesson-records-group.action";
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

export interface EditGroupInitialData {
  recordIds: string[];
  lessonId: string;
  studentIds: string[];
  recordedAt: string;
  status: LessonRecordStatus;
  durationMinutes: number | null;
  note: string | null;
  /** Pre-selected students, shown even before a classroom is picked. */
  students: { studentId: string; firstName: string; lastName: string }[];
}

interface Props {
  lessons: LessonOption[];
  classes: { id: string; name: string }[];
  editGroup?: EditGroupInitialData;
}

const nowIso = () => new Date().toISOString();

export const LessonFirstBulkEntry = ({ lessons, classes, editGroup }: Props) => {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolClassId = searchParams.get("classId") ?? "";
  const timeZone = useUser()?.orgTimezone ?? "Europe/Zurich";
  const [isPending, startTransition] = useTransition();
  const [students, setStudents] = useState<ClassroomStudentDTO[]>(
    editGroup
      ? editGroup.students.map((s) => ({
          enrollmentId: s.studentId,
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
        }))
      : [],
  );
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [recentRefreshKey, setRecentRefreshKey] = useState(0);
  const isEditMode = !!editGroup;

  const form = useForm<LessonRecordsBulkFormValues>({
    resolver: zodResolver(lessonRecordsBulkSchema),
    defaultValues: editGroup
      ? {
          lessonId: editGroup.lessonId,
          studentIds: editGroup.studentIds,
          recordedAt: editGroup.recordedAt,
          status: editGroup.status,
          durationMinutes: editGroup.durationMinutes,
          note: editGroup.note ?? "",
        }
      : {
          lessonId: "",
          studentIds: [],
          recordedAt: nowIso(),
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
      // Edit mode has no classroom context yet — keep the group's own
      // students visible/selected instead of clearing the picker.
      if (!isEditMode) {
        setStudents([]);
        form.setValue("studentIds", []);
      }
      return;
    }
    let cancelled = false;
    setLoadingStudents(true);
    getClassroomStudentsAction(schoolClassId)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          if (isEditMode && editGroup) {
            // Merge: keep the pre-selected children (they may belong to a
            // different classroom) and add the picked classroom's roster,
            // deduped by studentId.
            const merged = new Map(
              editGroup.students.map((s) => [
                s.studentId,
                {
                  enrollmentId: s.studentId,
                  studentId: s.studentId,
                  firstName: s.firstName,
                  lastName: s.lastName,
                },
              ]),
            );
            for (const s of res.data) merged.set(s.studentId, s);
            setStudents(Array.from(merged.values()));
          } else {
            setStudents(res.data);
            form.setValue("studentIds", []);
          }
        } else {
          setStudents(isEditMode && editGroup ? students : []);
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
    const date =
      typeof recordedAt === "string" ? new Date(recordedAt) : recordedAt;
    if (!date) return null;
    try {
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        // School-local — this also renders server-side, where the runtime
        // zone is UTC.
        timeZone,
      }).format(date);
    } catch {
      return typeof recordedAt === "string" ? recordedAt : null;
    }
  }, [recordedAt, locale, timeZone]);

  const subtitleParts = [
    selectedClassName,
    t("childrenCount", { count: students.length }),
    formattedRecordedAt,
  ].filter(Boolean);

  const cancelHref = isEditMode
    ? ROUTES.admin.recordKeeping(locale)
    : schoolClassId
      ? `${ROUTES.admin.recordKeepingStudents(locale)}?classId=${schoolClassId}`
      : ROUTES.admin.recordKeepingStudents(locale);

  const onSubmit = (values: LessonRecordsBulkFormValues) => {
    startTransition(async () => {
      // Always a full ISO timestamp: a legacy date-only value would otherwise
      // travel through untouched and come back as midnight UTC (02:00 local),
      // discarding the time that was picked.
      const recordedAtIso = new Date(values.recordedAt).toISOString();

      if (isEditMode && editGroup) {
        const res = await updateLessonRecordsGroupAction({
          recordIds: editGroup.recordIds,
          lessonId: values.lessonId,
          recordedAt: recordedAtIso,
          studentIds: values.studentIds,
          status: values.status as LessonRecordStatus,
          durationMinutes: values.durationMinutes ?? null,
          note: values.note?.trim() ? values.note : null,
        });

        if (!res.success) {
          toast.error(t("recordsUpdateError"), { description: res.error });
          return;
        }

        toast.success(t("editSavedToast"));
        router.push(cancelHref);
        router.refresh();
        return;
      }

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
      router.push(ROUTES.admin.recordKeeping(locale));
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <BackButton href={cancelHref} label={t("backToRecording")} />

      <PageHead
        title={isEditMode ? t("editEntryTitle") : t("title")}
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
              {isPending
                ? t("submitting")
                : isEditMode
                  ? t("saveChanges")
                  : t("recordAction")}
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
                  <DateTimeCalendarFormField
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
                  <>
                    <SearchInput
                      value={studentSearch}
                      onValueChange={setStudentSearch}
                      placeholder={t("searchStudentsPlaceholder")}
                      aria-label={t("searchStudentsPlaceholder")}
                    />
                    {filteredStudents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("noStudentsFound")}
                      </p>
                    ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {filteredStudents.map((s) => {
                      const checked = studentIds.includes(s.studentId);
                      return (
                        <button
                          key={s.studentId}
                          type="button"
                          aria-pressed={checked}
                          onClick={() => toggleStudent(s.studentId)}
                          className={cn(
                            "group relative flex items-center gap-2 rounded-lg border bg-card py-2 pl-2 pr-7 text-left transition hover:bg-accent",
                            checked
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border",
                          )}
                        >
                          <StudentAvatar
                            firstName={s.firstName}
                            lastName={s.lastName}
                            className="h-8 w-8 shrink-0 text-xs"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium leading-tight">
                            {s.firstName} {s.lastName}
                          </span>
                          {checked && (
                            <Check
                              aria-hidden
                              className="absolute right-2 size-4 text-primary"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                    )}
                  </>
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
                <TextareaFormField
                  name="note"
                  label="note"
                  placeholder={t("notePlaceholder")}
                  rows={3}
                  namespace="RecordKeeping"
                  className="flex flex-col gap-2"
                />

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
            {!isEditMode && (
              <RecentRecordsCard
                refreshKey={recentRefreshKey}
                onSelect={(id) =>
                  form.setValue("lessonId", id, { shouldValidate: true })
                }
              />
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};
