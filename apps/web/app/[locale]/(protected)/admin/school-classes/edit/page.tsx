import CreateSchoolClassPageForm from "@/features/school-classes/components/CreateSchoolClassPageForm";
import { getGradeLevelsAction } from "@/features/grade-levels/actions/get-grade-levels.action";
import { getTeachersAction } from "@/features/school-classes/actions/get-teachers.action";
import { getTranslations } from "next-intl/server";

export default async function CreateSchoolClassPage() {
  const t = await getTranslations("SchoolClasses");
  const [gradeLevelsResult, teachersResult] = await Promise.all([
    getGradeLevelsAction(),
    getTeachersAction(),
  ]);
  const gradeLevels = gradeLevelsResult.success
    ? (gradeLevelsResult.data ?? [])
    : [];
  const teachers = teachersResult.success ? teachersResult.data : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("createSchoolClass")}</h1>
      <CreateSchoolClassPageForm
        gradeLevels={gradeLevels}
        teachers={teachers}
      />
    </div>
  );
}
