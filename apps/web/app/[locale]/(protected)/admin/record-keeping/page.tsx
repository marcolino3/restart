import { getLessonsForOrgAction } from "@/features/record-keeping/actions/get-lessons-for-org.action";
import { LessonFirstBulkEntry } from "@/features/record-keeping/components/LessonFirstBulkEntry";

const RecordKeepingPage = async () => {
  const lessonsRes = await getLessonsForOrgAction();
  const lessons = lessonsRes.success ? lessonsRes.data : [];

  return (
    <div className="flex flex-col gap-6">
      <LessonFirstBulkEntry lessons={lessons} />
    </div>
  );
};

export default RecordKeepingPage;
