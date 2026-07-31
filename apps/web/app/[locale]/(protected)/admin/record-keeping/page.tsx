import { getLessonsForOrgAction } from "@/features/record-keeping/actions/get-lessons-for-org.action";
import { LessonFirstBulkEntry } from "@/features/record-keeping/components/LessonFirstBulkEntry";

interface Props {
  searchParams: Promise<{ classId?: string }>;
}

const RecordKeepingPage = async ({ searchParams }: Props) => {
  // The class picker in the layout writes ?classId=. Passing it down narrows
  // the lesson list to that class's curriculum cycle; without a configured
  // cycle the backend returns every lesson, so entry keeps working.
  const { classId } = await searchParams;
  const lessonsRes = await getLessonsForOrgAction(classId ?? null);
  const lessons = lessonsRes.success ? lessonsRes.data : [];

  return (
    <div className="flex flex-col gap-6">
      <LessonFirstBulkEntry lessons={lessons} />
    </div>
  );
};

export default RecordKeepingPage;
