"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Paperclip } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DetailCols,
  DetailPanel,
  KvRow,
} from "@/components/common/DetailPanel";
import { BackButton } from "@/components/common/BackButton";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

import type { StudentDetail } from "../actions/get-student-by-id.action";
import { getStudentEnrollmentsAction } from "../actions/get-student-enrollments.action";
import { getSchoolClassesAction } from "@/features/school-classes/actions/get-school-classes.action";
import { getStudentContactPersonsAction } from "@/features/contact-persons/actions/get-student-contact-persons.action";
import { getContactPersonsAction } from "@/features/contact-persons/actions/get-contact-persons.action";
import { getStudentNotesAction } from "@/features/student-notes/actions/get-student-notes.action";
import { getStudentLessonRecordsAction } from "@/features/record-keeping/actions/get-student-lesson-records.action";
import { getNextLessonsForStudentAction } from "@/features/record-keeping/actions/get-next-lessons-for-student.action";
import { getOrgAreasAction } from "@/features/record-keeping/actions/get-org-areas.action";
import { getAreaLessonCountsAction } from "@/features/record-keeping/actions/get-area-lesson-counts.action";
import { getLessonsForOrgAction } from "@/features/record-keeping/actions/get-lessons-for-org.action";
import { getRecordKeepingSettingsAction } from "@/features/record-keeping-settings/actions/get-record-keeping-settings.action";
import { DEFAULT_ATTENTION_THRESHOLDS } from "@/features/record-keeping/lib/derive-attention-items";

import type { EnrollmentItem } from "../actions/get-student-enrollments.action";
import type { StudentContactPersonItem } from "@/features/contact-persons/actions/get-student-contact-persons.action";
import type { ContactPersonListItem } from "@/features/contact-persons/actions/get-contact-persons.action";
import type { SchoolClassListItem } from "@/features/school-classes/actions/get-school-classes.action";
import type { StudentNoteItem } from "@/features/student-notes/actions/get-student-notes.action";
import type { StudentLessonRecordItem } from "@/features/record-keeping/actions/get-student-lesson-records.action";
import type { AreaOption } from "@/features/record-keeping/actions/get-org-areas.action";
import type { AreaLessonCount } from "@/features/record-keeping/actions/get-area-lesson-counts.action";
import type {
  LessonOption,
  LessonRecordStatus,
} from "@/features/record-keeping/types";

import { StudentAvatar } from "./StudentAvatar";
import { StudentEnrollmentsList } from "./StudentEnrollmentsList";
import { StudentContactPersonsList } from "./StudentContactPersonsList";
import StudentNotesFeed from "@/features/student-notes/components/StudentNotesFeed";
import StudentNotesTimeline from "@/features/student-notes/components/StudentNotesTimeline";
import CreateStudentNoteInline from "@/features/student-notes/components/CreateStudentNoteInline";
import { StudentProgressTab } from "@/features/record-keeping/components/StudentProgressTab";
import { ConsentTab } from "@/features/consent/components/ConsentTab";
import { StudentRecordTab } from "@/features/student-records/components/StudentRecordTab";
import { usePermissions } from "@/features/users/context/current-user.context";
import {
  getStudentRecordEntriesAction,
  type StudentRecordEntry,
} from "@/features/student-records/actions/record-entries-actions";
import {
  getStudentRecordCategoriesAction,
  type StudentRecordCategory,
} from "@/features/student-records/actions/record-categories-actions";

interface StudentViewPageProps {
  student: StudentDetail;
  studentName: string;
}

type EnrollmentsData = {
  enrollments: EnrollmentItem[];
  schoolClasses: SchoolClassListItem[];
};

type ContactPersonsData = {
  contactPersonLinks: StudentContactPersonItem[];
  allContactPersons: ContactPersonListItem[];
};

type LogbookData = {
  notes: StudentNoteItem[];
};

type OverviewData = {
  contactPersonLinks: StudentContactPersonItem[];
  lessonRecords: StudentLessonRecordItem[];
  notes: StudentNoteItem[];
};

type ProgressData = {
  lessonRecords: StudentLessonRecordItem[];
  nextLessons: LessonOption[];
  allAreas: AreaOption[];
  areaLessonCounts: AreaLessonCount[];
  allLessons: LessonOption[];
  attentionThresholds: {
    introducedStuckDays: number;
    practicedStuckDays: number;
    bigGapDays: number;
  };
};

function useLazyData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const triggered = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const trigger = useCallback(() => {
    if (triggered.current) return;
    triggered.current = true;
    setLoading(true);
    fetcherRef
      .current()
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, trigger };
}

function TabLoadingSkeleton() {
  return (
    <div className="space-y-3 mt-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function PanelLoadingSkeleton() {
  return (
    <div className="mt-2 space-y-2.5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

/** Status tones from the design handoff (`--st-*`), mapped per record status. */
const STATUS_TONE: Record<LessonRecordStatus, { box: string; dot: string }> = {
  PLANNING: {
    box: "bg-status-slate text-status-slate-foreground",
    dot: "border-status-slate-foreground bg-status-slate",
  },
  MASTERED: {
    box: "bg-status-green text-status-green-foreground",
    dot: "border-status-green-foreground bg-status-green",
  },
  PRACTICED: {
    box: "bg-status-amber text-status-amber-foreground",
    dot: "border-status-amber-foreground bg-status-amber",
  },
  INTRODUCED: {
    box: "bg-status-sky text-status-sky-foreground",
    dot: "border-status-sky-foreground bg-status-sky",
  },
  NEEDS_MORE: {
    box: "bg-status-rose text-status-rose-foreground",
    dot: "border-status-rose-foreground bg-status-rose",
  },
};

const NOTE_DOT = "border-status-slate-foreground bg-status-slate";

/** Stat box from the design handoff (`.lsb`). */
function StatBox({
  label,
  value,
  toneClass,
}: {
  label: string;
  value: React.ReactNode;
  toneClass: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-ctl px-[15px] py-3",
        toneClass,
      )}
    >
      <span className="text-[11px] font-semibold opacity-70">{label}</span>
      <span className="text-[20px] font-bold tabular-nums">{value}</span>
    </div>
  );
}

/** Timeline entry from the design handoff (`.ev` / `.pt` / `.vl`). */
function TimelineEvent({
  when,
  title,
  subline,
  dotClass,
  isLast,
}: {
  when: string;
  title: string;
  subline?: string;
  dotClass: string;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex flex-col items-center">
        <span
          className={cn(
            "mt-[3px] size-[11px] shrink-0 rounded-full border-2",
            dotClass,
          )}
        />
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
      </span>
      <div className={cn("min-w-0", !isLast && "pb-4")}>
        <div className="text-[11px] font-semibold text-muted-foreground">
          {when}
        </div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        {subline && (
          <div className="truncate text-[12px] text-muted-foreground">
            {subline}
          </div>
        )}
      </div>
    </div>
  );
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  return (
    (firstName?.charAt(0)?.toUpperCase() ?? "") +
      (lastName?.charAt(0)?.toUpperCase() ?? "") || "?"
  );
}

export default function StudentViewPage({
  student,
  studentName,
}: StudentViewPageProps) {
  const t = useTranslations("Common");
  const tS = useTranslations("Students");
  const tN = useTranslations("StudentNotes");
  const tR = useTranslations("RecordKeeping");
  const tC = useTranslations("ConsentManagement");
  const tCP = useTranslations("ContactPersons");
  const tSR = useTranslations("StudentRecords");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  const overviewTab = useLazyData<OverviewData>(async () => {
    const [linksResult, recordsResult, notesResult] = await Promise.all([
      getStudentContactPersonsAction(student.id),
      getStudentLessonRecordsAction(student.id),
      getStudentNotesAction(student.id),
    ]);
    return {
      contactPersonLinks:
        linksResult.success && linksResult.data ? linksResult.data : [],
      lessonRecords: recordsResult.success ? (recordsResult.data ?? []) : [],
      notes: notesResult.success ? (notesResult.data ?? []) : [],
    };
  });

  const enrollmentsTab = useLazyData<EnrollmentsData>(async () => {
    const [enrollmentsResult, classesResult] = await Promise.all([
      getStudentEnrollmentsAction(student.id),
      getSchoolClassesAction(),
    ]);
    return {
      enrollments: enrollmentsResult.success
        ? (enrollmentsResult.data ?? [])
        : [],
      schoolClasses: classesResult.success ? (classesResult.data ?? []) : [],
    };
  });

  const contactPersonsTab = useLazyData<ContactPersonsData>(async () => {
    const [linksResult, allResult] = await Promise.all([
      getStudentContactPersonsAction(student.id),
      getContactPersonsAction(),
    ]);
    return {
      contactPersonLinks: linksResult.success ? (linksResult.data ?? []) : [],
      allContactPersons: allResult.success ? (allResult.data ?? []) : [],
    };
  });

  const logbookTab = useLazyData<LogbookData>(async () => {
    const result = await getStudentNotesAction(student.id);
    return { notes: result.success ? (result.data ?? []) : [] };
  });

  const progressTab = useLazyData<ProgressData>(async () => {
    const [
      lessonRecordsResult,
      nextLessonsResult,
      areasResult,
      areaLessonCountsResult,
      allLessonsResult,
      settingsResult,
    ] = await Promise.all([
      getStudentLessonRecordsAction(student.id),
      getNextLessonsForStudentAction(student.id, 10),
      getOrgAreasAction(),
      getAreaLessonCountsAction(),
      getLessonsForOrgAction(),
      getRecordKeepingSettingsAction(),
    ]);
    return {
      lessonRecords: lessonRecordsResult.success
        ? (lessonRecordsResult.data ?? [])
        : [],
      nextLessons: nextLessonsResult.success
        ? (nextLessonsResult.data ?? [])
        : [],
      allAreas: areasResult.success ? (areasResult.data ?? []) : [],
      areaLessonCounts: areaLessonCountsResult.success
        ? (areaLessonCountsResult.data ?? [])
        : [],
      allLessons: allLessonsResult.success
        ? (allLessonsResult.data ?? [])
        : [],
      attentionThresholds: settingsResult.success
        ? settingsResult.data
        : DEFAULT_ATTENTION_THRESHOLDS,
    };
  });

  const supportTab = useLazyData<{
    entries: StudentRecordEntry[];
    categories: StudentRecordCategory[];
  }>(async () => {
    const [entriesResult, categories] = await Promise.all([
      getStudentRecordEntriesAction(student.id),
      getStudentRecordCategoriesAction(),
    ]);
    return {
      entries: entriesResult.success ? entriesResult.data : [],
      categories,
    };
  });

  useEffect(() => {
    switch (activeTab) {
      case "overview":
        overviewTab.trigger();
        break;
      case "enrollments":
        enrollmentsTab.trigger();
        break;
      case "contactPersons":
        contactPersonsTab.trigger();
        break;
      case "logbook":
        logbookTab.trigger();
        break;
      case "progress":
        progressTab.trigger();
        break;
      case "support":
        supportTab.trigger();
        break;
    }
  }, [
    activeTab,
    overviewTab,
    enrollmentsTab,
    contactPersonsTab,
    logbookTab,
    progressTab,
    supportTab,
  ]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString(
      locale === "de" ? "de-CH" : "en-GB",
      { day: "numeric", month: "long", year: "numeric" },
    );
  };

  const shortDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB");

  const monthYear = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", {
      month: "short",
      year: "numeric",
    });

  const lessonName = (
    lesson: StudentLessonRecordItem["lesson"],
  ): string | null =>
    lesson?.translations.find((tr) => tr.locale === locale)?.name ??
    lesson?.translations[0]?.name ??
    null;

  // Kopf-Chips: geb.-Datum + Alter, Eintritt, Status.
  const ageYears = (dob: string): number => {
    const b = new Date(dob);
    const now = new Date();
    let a = now.getFullYear() - b.getFullYear();
    if (
      now.getMonth() < b.getMonth() ||
      (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
    ) {
      a--;
    }
    return a;
  };

  const metaChips: string[] = [t("STUDENT")];
  if (student.dateOfBirth) {
    metaChips.push(
      tS("birthInfo", {
        date: shortDate(student.dateOfBirth),
        age: ageYears(student.dateOfBirth),
      }),
    );
  }
  if (student.enrollmentDate) {
    metaChips.push(tS("joinedOn", { date: monthYear(student.enrollmentDate) }));
  }
  if (!student.isActive) metaChips.push(t("inactive"));

  // Lernstand: aktueller Status = jüngster Record pro Lektion.
  const learningCounts = useMemo(() => {
    const counts: Record<LessonRecordStatus, number> = {
      PLANNING: 0,
      INTRODUCED: 0,
      PRACTICED: 0,
      MASTERED: 0,
      NEEDS_MORE: 0,
    };
    if (!overviewTab.data) return counts;
    const latestPerLesson = new Map<string, StudentLessonRecordItem>();
    for (const rec of overviewTab.data.lessonRecords) {
      const prev = latestPerLesson.get(rec.lessonId);
      if (!prev || rec.recordedAt > prev.recordedAt) {
        latestPerLesson.set(rec.lessonId, rec);
      }
    }
    for (const rec of latestPerLesson.values()) {
      if (rec.status in counts) counts[rec.status]++;
    }
    return counts;
  }, [overviewTab.data]);

  // Letzte Ereignisse: Lesson-Records + Logbuch-Einträge gemischt, neueste zuerst.
  const recentEvents = useMemo(() => {
    if (!overviewTab.data) return [];
    type Ev = {
      id: string;
      date: string;
      when: string;
      title: string;
      subline?: string;
      dotClass: string;
    };
    const events: Ev[] = [];
    for (const rec of overviewTab.data.lessonRecords) {
      const name = lessonName(rec.lesson);
      const path = rec.lesson?.ancestors
        ?.map((a) => a.translations.find((tr) => tr.locale === locale)?.name ?? a.translations[0]?.name)
        .filter(Boolean)
        .join(" › ");
      const by =
        rec.recordedBy &&
        [rec.recordedBy.firstName, rec.recordedBy.lastName]
          .filter(Boolean)
          .join(" ");
      events.push({
        id: `rec-${rec.id}`,
        date: rec.recordedAt,
        when: formatDate(rec.recordedAt),
        title: name ? `${name} — ${tR(rec.status)}` : tR(rec.status),
        subline:
          [path, by ? tS("recordedBy", { name: by }) : null]
            .filter(Boolean)
            .join(" · ") || undefined,
        dotClass: STATUS_TONE[rec.status]?.dot ?? NOTE_DOT,
      });
    }
    for (const note of overviewTab.data.notes) {
      const author = note.authorMembership.user
        ? `${note.authorMembership.user.firstName} ${note.authorMembership.user.lastName}`
        : null;
      events.push({
        id: `note-${note.id}`,
        date: note.date,
        when: formatDate(note.date),
        title: note.title,
        subline: author ? tS("recordedBy", { name: author }) : undefined,
        dotClass: NOTE_DOT,
      });
    }
    return events.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewTab.data, locale]);

  const { hasPermission } = usePermissions();
  const canReadRecords = hasPermission("STUDENT_RECORD_READ");

  // pf-tabs (saas-konzept): Accent-Unterstrich statt Pill-Container.
  const tabCls =
    "rounded-none border-b-[3px] border-transparent px-0 pb-[11px] text-[13.5px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-[650] data-[state=active]:text-foreground data-[state=active]:shadow-none";

  return (
    <div className="space-y-[18px]">
      <BackButton
        href={ROUTES.admin.students(locale)}
        label={tS("backToStudents")}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Profile band — saas-konzept `.pf-band` (light panel) */}
        <div className="mb-[18px] overflow-x-auto rounded-card border bg-card px-[22px] pt-[18px] shadow-xs">
          <div className="flex flex-wrap items-center gap-4">
            <StudentAvatar
              studentId={student.id}
              firstName={student.firstName}
              lastName={student.lastName}
              className="size-[52px] shrink-0 rounded-[16px]"
              fallbackClassName="rounded-[16px] text-[18px]"
            />
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold tracking-[-0.02em]">
                {studentName}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {metaChips.map((chip, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-field px-[11px] py-1 text-[11.5px] font-semibold text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <div className="ml-auto flex shrink-0 gap-[9px]">
              <Button asChild className="h-9">
                <Link
                  href={`${ROUTES.admin.studentsEdit(locale, student.id)}?tab=${activeTab}`}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("edit")}
                </Link>
              </Button>
            </div>
          </div>
          <TabsList className="mt-[14px] h-auto justify-start gap-[22px] rounded-none bg-transparent p-0">
            <TabsTrigger className={tabCls} value="overview">
              {tS("overview")}
            </TabsTrigger>
            <TabsTrigger className={tabCls} value="address" disabled>
              {t("address")}
            </TabsTrigger>
            <TabsTrigger
              className={tabCls}
              value="enrollments"
              onMouseEnter={enrollmentsTab.trigger}
              onFocus={enrollmentsTab.trigger}
            >
              {tS("enrollments")}
            </TabsTrigger>
            <TabsTrigger
              className={tabCls}
              value="progress"
              onMouseEnter={progressTab.trigger}
              onFocus={progressTab.trigger}
            >
              {tR("title")}
            </TabsTrigger>
            <TabsTrigger
              className={tabCls}
              value="contactPersons"
              onMouseEnter={contactPersonsTab.trigger}
              onFocus={contactPersonsTab.trigger}
            >
              {tS("contactPersons")}
            </TabsTrigger>
            <TabsTrigger className={tabCls} value="consent">
              {tC("tabConsent")}
            </TabsTrigger>
            {canReadRecords && (
              <TabsTrigger
                className={tabCls}
                value="support"
                onMouseEnter={supportTab.trigger}
                onFocus={supportTab.trigger}
              >
                {tSR("title")}
              </TabsTrigger>
            )}
            <TabsTrigger
              className={tabCls}
              value="logbook"
              onMouseEnter={logbookTab.trigger}
              onFocus={logbookTab.trigger}
            >
              {tN("logbook")}
            </TabsTrigger>
            <TabsTrigger className={tabCls} value="documents" disabled>
              {tS("attachments")}
            </TabsTrigger>
            <TabsTrigger className={tabCls} value="history" disabled>
              {tS("history")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview — design cols2: Ereignis-Timeline + Lernstand + Bezugspersonen */}
        <TabsContent value="overview">
          <DetailCols>
            <div className="flex flex-col gap-3.5">
              <DetailPanel title={tS("recentEvents")}>
                {overviewTab.data ? (
                  recentEvents.length ? (
                    <div className="mt-2.5">
                      {recentEvents.map((ev, i) => (
                        <TimelineEvent
                          key={ev.id}
                          when={ev.when}
                          title={ev.title}
                          subline={ev.subline}
                          dotClass={ev.dotClass}
                          isLast={i === recentEvents.length - 1}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {tS("noRecentEvents")}
                    </p>
                  )
                ) : (
                  <PanelLoadingSkeleton />
                )}
              </DetailPanel>

              <DetailPanel title={tS("personalData")}>
                <KvRow label={t("firstName")}>{student.firstName || "–"}</KvRow>
                <KvRow label={t("lastName")}>{student.lastName || "–"}</KvRow>
                <KvRow label={t("dateOfBirth")}>
                  {formatDate(student.dateOfBirth)}
                </KvRow>
                <KvRow label={t("gender")}>
                  {student.gender ? t(student.gender) : "–"}
                </KvRow>
                <KvRow label={tS("enrollmentDate")}>
                  {formatDate(student.enrollmentDate)}
                </KvRow>
                <KvRow label={tS("exitDate")}>
                  {formatDate(student.exitDate)}
                </KvRow>
                <KvRow label={tS("status")}>
                  {student.isActive ? t("active") : t("inactive")}
                </KvRow>
                {student.notes && (
                  <KvRow label={t("notes")}>
                    <span className="whitespace-pre-wrap font-normal text-muted-foreground">
                      {student.notes}
                    </span>
                  </KvRow>
                )}
              </DetailPanel>
            </div>

            <div className="flex flex-col gap-3.5">
              <DetailPanel title={tS("learningState")}>
                {overviewTab.data ? (
                  <div className="mt-2.5 grid grid-cols-2 gap-[9px]">
                    <StatBox
                      label={tR("MASTERED")}
                      value={learningCounts.MASTERED}
                      toneClass={STATUS_TONE.MASTERED.box}
                    />
                    <StatBox
                      label={tR("PRACTICED")}
                      value={learningCounts.PRACTICED}
                      toneClass={STATUS_TONE.PRACTICED.box}
                    />
                    <StatBox
                      label={tR("INTRODUCED")}
                      value={learningCounts.INTRODUCED}
                      toneClass={STATUS_TONE.INTRODUCED.box}
                    />
                    <StatBox
                      label={tR("NEEDS_MORE")}
                      value={learningCounts.NEEDS_MORE}
                      toneClass={STATUS_TONE.NEEDS_MORE.box}
                    />
                  </div>
                ) : (
                  <PanelLoadingSkeleton />
                )}
              </DetailPanel>

              <DetailPanel title={tS("contactPersons")}>
                {overviewTab.data ? (
                  overviewTab.data.contactPersonLinks.length ? (
                    <div className="mt-1.5">
                      {overviewTab.data.contactPersonLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 border-b border-border py-[9px] last:border-b-0"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-accent-foreground">
                            {getInitials(
                              link.contactPerson.firstName,
                              link.contactPerson.lastName,
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-semibold">
                              {link.contactPerson.firstName}{" "}
                              {link.contactPerson.lastName}
                            </span>
                            <span className="block truncate text-[12px] text-muted-foreground">
                              {[
                                tCP(link.relationshipType),
                                link.hasCustody ? tS("custody") : null,
                                link.contactPerson.phone ||
                                  link.contactPerson.mobile,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {tS("noContactPersons")}
                    </p>
                  )
                ) : (
                  <PanelLoadingSkeleton />
                )}
              </DetailPanel>
            </div>
          </DetailCols>
        </TabsContent>

        {/* Enrollments */}
        <TabsContent value="enrollments">
          {enrollmentsTab.data ? (
            <StudentEnrollmentsList
              studentId={student.id}
              enrollments={enrollmentsTab.data.enrollments}
              schoolClasses={enrollmentsTab.data.schoolClasses}
            />
          ) : (
            <TabLoadingSkeleton />
          )}
        </TabsContent>

        {/* Progress */}
        <TabsContent value="progress">
          {progressTab.data ? (
            <StudentProgressTab
              studentId={student.id}
              records={progressTab.data.lessonRecords}
              nextLessons={progressTab.data.nextLessons}
              allAreas={progressTab.data.allAreas}
              areaLessonCounts={progressTab.data.areaLessonCounts}
              allLessons={progressTab.data.allLessons}
              attentionThresholds={progressTab.data.attentionThresholds}
            />
          ) : (
            <TabLoadingSkeleton />
          )}
        </TabsContent>

        {/* Contact Persons */}
        <TabsContent value="contactPersons">
          {contactPersonsTab.data ? (
            <StudentContactPersonsList
              studentId={student.id}
              links={contactPersonsTab.data.contactPersonLinks}
              allContactPersons={contactPersonsTab.data.allContactPersons}
            />
          ) : (
            <TabLoadingSkeleton />
          )}
        </TabsContent>

        {/* Einwilligungen */}
        <TabsContent value="consent">
          <ConsentTab subjectType="STUDENT" subjectId={student.id} />
        </TabsContent>

        {/* Support / Förderung */}
        {canReadRecords && (
          <TabsContent value="support">
            {supportTab.data ? (
              <StudentRecordTab
                studentId={student.id}
                entries={supportTab.data.entries}
                categories={supportTab.data.categories}
              />
            ) : (
              <TabLoadingSkeleton />
            )}
          </TabsContent>
        )}

        {/* Logbook */}
        <TabsContent value="logbook">
          {logbookTab.data ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="bg-card shadow-sm sm:overflow-hidden sm:rounded-lg border">
                  <div className="divide-y divide-border">
                    <div className="px-4 py-5 sm:px-6">
                      <h2 className="text-lg font-medium text-foreground">
                        {tN("logbook")}
                      </h2>
                    </div>
                    <div className="px-4 py-6 sm:px-6">
                      <StudentNotesFeed notes={logbookTab.data.notes} />
                    </div>
                  </div>
                  <div className="bg-muted/50 px-4 py-6 sm:px-6">
                    <CreateStudentNoteInline studentId={student.id} />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <StudentNotesTimeline notes={logbookTab.data.notes} />
              </div>
            </div>
          ) : (
            <TabLoadingSkeleton />
          )}
        </TabsContent>

        {/* Documents (placeholder) */}
        <TabsContent value="documents">
          <DetailPanel title={tS("attachments")}>
            <ul
              role="list"
              className="mt-2 divide-y divide-border rounded-ctl border border-border"
            >
              <li className="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6">
                <div className="flex w-0 flex-1 items-center">
                  <Paperclip
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground"
                  />
                  <div className="ml-4 flex min-w-0 flex-1 gap-2">
                    <span className="truncate font-medium text-muted-foreground">
                      {tS("comingSoon")}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </DetailPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
