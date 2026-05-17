import { getStudentByIdAction } from "@/features/students/actions/get-student-by-id.action";
import StudentViewPage from "@/features/students/components/StudentViewPage";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ studentId: string }>;
}

const ViewStudentPage = async ({ params }: Props) => {
  const { studentId } = await params;
  const t = await getTranslations("Students");

  const studentResult = await getStudentByIdAction(studentId);

  if (!studentResult.success || !studentResult.data) {
    notFound();
  }

  const student = studentResult.data;
  const studentName = `${student.firstName} ${student.lastName}`.trim() || t("students");

  return (
    <div className="space-y-6">
      <StudentViewPage student={student} studentName={studentName} />
    </div>
  );
};

export default ViewStudentPage;
