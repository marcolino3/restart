"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Paperclip } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/common/BackButton";
import { ROUTES } from "@/constants/routes";

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
import type { LessonOption } from "@/features/record-keeping/types";

import { StudentAvatar } from "./StudentAvatar";
import { StudentEnrollmentsList } from "./StudentEnrollmentsList";
import { StudentContactPersonsList } from "./StudentContactPersonsList";
import StudentNotesFeed from "@/features/student-notes/components/StudentNotesFeed";
import StudentNotesTimeline from "@/features/student-notes/components/StudentNotesTimeline";
import CreateStudentNoteInline from "@/features/student-notes/components/CreateStudentNoteInline";
import { StudentProgressTab } from "@/features/record-keeping/components/StudentProgressTab";

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

export default function StudentViewPage({
  student,
  studentName,
}: StudentViewPageProps) {
  const t = useTranslations("Common");
  const tS = useTranslations("Students");
  const tN = useTranslations("StudentNotes");
  const tR = useTranslations("RecordKeeping");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

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

  useEffect(() => {
    switch (activeTab) {
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
    }
  }, [activeTab, enrollmentsTab, contactPersonsTab, logbookTab, progressTab]);

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

  return (
    <div className="min-h-full">
      <main className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 mb-4">
          <BackButton
            href={ROUTES.admin.students(locale)}
            label={tS("backToStudents")}
          />
        </div>
        {/* Page header */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-7xl lg:px-8">
          <div className="flex items-center space-x-5">
            <div className="shrink-0">
              <StudentAvatar
                studentId={student.id}
                firstName={student.firstName}
                lastName={student.lastName}
                className="h-16 w-16"
                fallbackClassName="text-xl"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {studentName}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                <span className="text-foreground">{t("STUDENT")}</span>
                {student.enrollmentDate && (
                  <>
                    {" "}
                    {tS("since")}{" "}
                    <span className="text-foreground">
                      {formatDate(student.enrollmentDate)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="mt-6 flex md:mt-0">
            <Button asChild>
              <Link
                href={`${ROUTES.admin.studentsEdit(locale, student.id)}?tab=${activeTab}`}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t("edit")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="overview">{tS("overview")}</TabsTrigger>
              <TabsTrigger value="address" disabled>
                {t("address")}
              </TabsTrigger>
              <TabsTrigger
                value="enrollments"
                onMouseEnter={enrollmentsTab.trigger}
                onFocus={enrollmentsTab.trigger}
              >
                {tS("enrollments")}
              </TabsTrigger>
              <TabsTrigger
                value="progress"
                onMouseEnter={progressTab.trigger}
                onFocus={progressTab.trigger}
              >
                {tR("title")}
              </TabsTrigger>
              <TabsTrigger
                value="contactPersons"
                onMouseEnter={contactPersonsTab.trigger}
                onFocus={contactPersonsTab.trigger}
              >
                {tS("contactPersons")}
              </TabsTrigger>
              <TabsTrigger
                value="logbook"
                onMouseEnter={logbookTab.trigger}
                onFocus={logbookTab.trigger}
              >
                {tN("logbook")}
              </TabsTrigger>
              <TabsTrigger value="documents" disabled>
                {tS("attachments")}
              </TabsTrigger>
              <TabsTrigger value="history" disabled>
                {tS("history")}
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview">
              <div className="px-4 sm:px-0">
                <h3 className="text-base/7 font-semibold text-foreground">
                  {tS("overview")}
                </h3>
              </div>
              <div className="mt-6 border-t border-border">
                <dl className="divide-y divide-border">
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("firstName")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {student.firstName || "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("lastName")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {student.lastName || "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("dateOfBirth")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {formatDate(student.dateOfBirth)}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("gender")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {student.gender ? t(student.gender) : "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {tS("enrollmentDate")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {formatDate(student.enrollmentDate)}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {tS("exitDate")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {formatDate(student.exitDate)}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {tS("status")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {student.isActive ? t("active") : t("inactive")}
                    </dd>
                  </div>
                  {student.notes && (
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-foreground">
                        {t("notes")}
                      </dt>
                      <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0 whitespace-pre-wrap">
                        {student.notes}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
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
              <div className="px-4 sm:px-0">
                <h3 className="text-base/7 font-semibold text-foreground">
                  {tS("attachments")}
                </h3>
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <ul
                  role="list"
                  className="divide-y divide-border rounded-md border border-border"
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
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
