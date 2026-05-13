import StudentForm from "@/features/students/components/StudentForm";
import { getTranslations } from "next-intl/server";

export default async function CreateStudentPage() {
  const t = await getTranslations("Students");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("createStudent")}</h1>
      <StudentForm />
    </div>
  );
}
