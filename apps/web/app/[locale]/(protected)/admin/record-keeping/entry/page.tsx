import { getLessonsForOrgAction } from "@/features/record-keeping/actions/get-lessons-for-org.action";
import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { getLessonRecordsByIdsAction } from "@/features/record-keeping/actions/get-lesson-records-by-ids.action";
import { LessonFirstBulkEntry } from "@/features/record-keeping/components/LessonFirstBulkEntry";
import type { EditGroupInitialData } from "@/features/record-keeping/components/LessonFirstBulkEntry";

interface Props {
  searchParams: Promise<{ classId?: string; recordIds?: string }>;
}

const RecordKeepingPage = async ({ searchParams }: Props) => {
  // The class picker (now part of LessonFirstBulkEntry's header) writes
  // ?classId=. Passing it down narrows the lesson list to that class's
  // curriculum cycle; without a configured cycle the backend returns every
  // lesson, so entry keeps working.
  const { classId, recordIds } = await searchParams;
  const [lessonsRes, classesRes] = await Promise.all([
    getLessonsForOrgAction(classId ?? null),
    getMyTeachingSchoolClassesAction(),
  ]);
  const lessons = lessonsRes.success ? lessonsRes.data : [];
  const classes = classesRes.success
    ? classesRes.data
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ id: c.id, name: c.name }))
    : [];

  let editGroup: EditGroupInitialData | undefined;
  if (recordIds) {
    const ids = recordIds.split(",").filter(Boolean);
    const groupRes = await getLessonRecordsByIdsAction(ids);
    if (groupRes.success && groupRes.data.length > 0) {
      const records = groupRes.data;
      const first = records[0];
      const students = records
        .map((r) => r.studentId)
        .filter((id, i, arr) => arr.indexOf(id) === i);
      editGroup = {
        recordIds: records.map((r) => r.id),
        lessonId: first.lessonId,
        studentIds: students,
        recordedAt: first.recordedAt,
        status: first.status,
        durationMinutes: first.durationMinutes,
        note: first.note,
        students: students.map((studentId) => {
          const rec = records.find((r) => r.studentId === studentId)!;
          return {
            studentId,
            firstName: rec.student?.firstName ?? "",
            lastName: rec.student?.lastName ?? "",
          };
        }),
      };
    }
  }

  return (
    <LessonFirstBulkEntry
      lessons={lessons}
      classes={classes}
      editGroup={editGroup}
    />
  );
};

export default RecordKeepingPage;
