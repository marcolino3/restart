import { getStudentByIdAction } from "@/features/students/actions/get-student-by-id.action";
import { getStudentEnrollmentsAction } from "@/features/students/actions/get-student-enrollments.action";
import { getSchoolClassesAction } from "@/features/school-classes/actions/get-school-classes.action";
import { getStudentContactPersonsAction } from "@/features/contact-persons/actions/get-student-contact-persons.action";
import { getContactPersonsAction } from "@/features/contact-persons/actions/get-contact-persons.action";
import StudentForm from "@/features/students/components/StudentForm";
import { StudentEnrollmentsList } from "@/features/students/components/StudentEnrollmentsList";
import { StudentContactPersonsList } from "@/features/students/components/StudentContactPersonsList";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ studentId: string }>;
}

const EditStudentPage = async ({ params }: Props) => {
  const { studentId } = await params;
  const t = await getTranslations("Students");

  const [studentResult, enrollmentsResult, classesResult, contactPersonLinksResult, allContactPersonsResult] = await Promise.all([
    getStudentByIdAction(studentId),
    getStudentEnrollmentsAction(studentId),
    getSchoolClassesAction(),
    getStudentContactPersonsAction(studentId),
    getContactPersonsAction(),
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {t("editStudent")} &ndash; {student.firstName} {student.lastName}
      </h1>
      <StudentForm student={student} />
      <StudentEnrollmentsList
        studentId={student.id}
        enrollments={enrollments}
        schoolClasses={schoolClasses}
      />
      <StudentContactPersonsList
        studentId={student.id}
        links={contactPersonLinks}
        allContactPersons={allContactPersons}
      />
    </div>
  );
};

export default EditStudentPage;
