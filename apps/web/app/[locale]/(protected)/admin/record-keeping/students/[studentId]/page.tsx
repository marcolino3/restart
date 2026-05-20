import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { getStudentByIdAction } from "@/features/students/actions/get-student-by-id.action";
import { getStudentLessonRecordsAction } from "@/features/record-keeping/actions/get-student-lesson-records.action";
import { getNextLessonsForStudentAction } from "@/features/record-keeping/actions/get-next-lessons-for-student.action";
import { getOrgAreasAction } from "@/features/record-keeping/actions/get-org-areas.action";
import { getAreaLessonCountsAction } from "@/features/record-keeping/actions/get-area-lesson-counts.action";
import { getLessonsForOrgAction } from "@/features/record-keeping/actions/get-lessons-for-org.action";
import { getRecordKeepingSettingsAction } from "@/features/record-keeping-settings/actions/get-record-keeping-settings.action";
import { DEFAULT_ATTENTION_THRESHOLDS } from "@/features/record-keeping/lib/derive-attention-items";
import { StudentProgressTab } from "@/features/record-keeping/components/StudentProgressTab";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

const StudentDetailPage = async ({ params }: PageProps) => {
  const { studentId } = await params;
  const t = await getTranslations("RecordKeeping");
  const locale = await getLocale();

  const studentResult = await getStudentByIdAction(studentId);
  if (!studentResult.success || !studentResult.data) {
    notFound();
  }
  const student = studentResult.data;

  const [
    lessonRecordsResult,
    nextLessonsResult,
    areasResult,
    areaLessonCountsResult,
    allLessonsResult,
    settingsResult,
  ] = await Promise.all([
    getStudentLessonRecordsAction(studentId),
    getNextLessonsForStudentAction(studentId, 10),
    getOrgAreasAction(),
    getAreaLessonCountsAction(),
    getLessonsForOrgAction(),
    getRecordKeepingSettingsAction(),
  ]);

  const lessonRecords = lessonRecordsResult.success
    ? (lessonRecordsResult.data ?? [])
    : [];
  const nextLessons = nextLessonsResult.success
    ? (nextLessonsResult.data ?? [])
    : [];
  const allAreas = areasResult.success ? (areasResult.data ?? []) : [];
  const areaLessonCounts = areaLessonCountsResult.success
    ? (areaLessonCountsResult.data ?? [])
    : [];
  const allLessons = allLessonsResult.success
    ? (allLessonsResult.data ?? [])
    : [];
  const attentionThresholds = settingsResult.success
    ? settingsResult.data
    : DEFAULT_ATTENTION_THRESHOLDS;

  const studentName =
    `${student.firstName} ${student.lastName}`.trim() || studentId;

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href={ROUTES.admin.recordKeepingStudents(locale)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("backToStudents")}
        </Link>
      </Button>

      <div className="flex items-center gap-4">
        <StudentAvatar
          studentId={student.id}
          firstName={student.firstName}
          lastName={student.lastName}
          className="h-14 w-14"
          fallbackClassName="text-lg"
        />
        <div>
          <h1 className="text-2xl font-bold">{studentName}</h1>
          <p className="text-sm text-muted-foreground">
            {t("studentDetailTitle")}
          </p>
        </div>
      </div>

      <StudentProgressTab
        studentId={studentId}
        records={lessonRecords}
        nextLessons={nextLessons}
        allAreas={allAreas}
        areaLessonCounts={areaLessonCounts}
        allLessons={allLessons}
        attentionThresholds={attentionThresholds}
      />
    </div>
  );
};

export default StudentDetailPage;
