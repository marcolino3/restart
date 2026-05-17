import { getStudentByIdAction } from "@/features/students/actions/get-student-by-id.action";
import { getStudentEnrollmentsAction } from "@/features/students/actions/get-student-enrollments.action";
import { getSchoolClassesAction } from "@/features/school-classes/actions/get-school-classes.action";
import { getStudentContactPersonsAction } from "@/features/contact-persons/actions/get-student-contact-persons.action";
import { getContactPersonsAction } from "@/features/contact-persons/actions/get-contact-persons.action";
import { getStudentNotesAction } from "@/features/student-notes/actions/get-student-notes.action";
import { getStudentLessonRecordsAction } from "@/features/record-keeping/actions/get-student-lesson-records.action";
import { getNextLessonsForStudentAction } from "@/features/record-keeping/actions/get-next-lessons-for-student.action";
import StudentViewPage from "@/features/students/components/StudentViewPage";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ studentId: string }>;
}

const ViewStudentPage = async ({ params }: Props) => {
  const { studentId } = await params;
  const t = await getTranslations("Students");

  const [
    studentResult,
    enrollmentsResult,
    classesResult,
    contactPersonLinksResult,
    allContactPersonsResult,
    notesResult,
    lessonRecordsResult,
    nextLessonsResult,
  ] = await Promise.all([
    getStudentByIdAction(studentId),
    getStudentEnrollmentsAction(studentId),
    getSchoolClassesAction(),
    getStudentContactPersonsAction(studentId),
    getContactPersonsAction(),
    getStudentNotesAction(studentId),
    getStudentLessonRecordsAction(studentId),
    getNextLessonsForStudentAction(studentId, 10),
  ]);

  if (!studentResult.success || !studentResult.data) {
    notFound();
  }

  const student = studentResult.data;
  const enrollments = enrollmentsResult.success
    ? (enrollmentsResult.data ?? [])
    : [];
  const schoolClasses = classesResult.success
    ? (classesResult.data ?? [])
    : [];
  const contactPersonLinks = contactPersonLinksResult.success
    ? (contactPersonLinksResult.data ?? [])
    : [];
  const allContactPersons = allContactPersonsResult.success
    ? (allContactPersonsResult.data ?? [])
    : [];
  const notes = notesResult.success ? (notesResult.data ?? []) : [];
  const lessonRecords = lessonRecordsResult.success
    ? (lessonRecordsResult.data ?? [])
    : [];
  const nextLessons = nextLessonsResult.success
    ? (nextLessonsResult.data ?? [])
    : [];
  const studentName = `${student.firstName} ${student.lastName}`.trim() || t("students");

  return (
    <div className="space-y-6">
      <StudentViewPage
        student={student}
        enrollments={enrollments}
        schoolClasses={schoolClasses}
        contactPersonLinks={contactPersonLinks}
        allContactPersons={allContactPersons}
        notes={notes}
        studentName={studentName}
        lessonRecords={lessonRecords}
        nextLessons={nextLessons}
      />
    </div>
  );
};

export default ViewStudentPage;
