import { getLessonsForOrgAction } from "@/features/record-keeping/actions/get-lessons-for-org.action";
import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { LessonFirstBulkEntry } from "@/features/record-keeping/components/LessonFirstBulkEntry";

interface Props {
  searchParams: Promise<{ classId?: string }>;
}

const RecordKeepingPage = async ({ searchParams }: Props) => {
  // The class picker (now part of LessonFirstBulkEntry's header) writes
  // ?classId=. Passing it down narrows the lesson list to that class's
  // curriculum cycle; without a configured cycle the backend returns every
  // lesson, so entry keeps working.
  const { classId } = await searchParams;
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

  return <LessonFirstBulkEntry lessons={lessons} classes={classes} />;
};

export default RecordKeepingPage;
