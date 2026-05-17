import { getSchoolClassByIdAction } from "@/features/school-classes/actions/get-school-class-by-id.action";
import { getGradeLevelsAction } from "@/features/grade-levels/actions/get-grade-levels.action";
import { getTeachersAction } from "@/features/school-classes/actions/get-teachers.action";
import EditSchoolClassPageForm from "@/features/school-classes/components/EditSchoolClassPageForm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ schoolClassId: string }>;
}

const EditSchoolClassPage = async ({ params }: Props) => {
  const { schoolClassId } = await params;
  const t = await getTranslations("SchoolClasses");

  const [result, gradeLevelsResult, teachersResult] = await Promise.all([
    getSchoolClassByIdAction(schoolClassId),
    getGradeLevelsAction(),
    getTeachersAction(),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  const gradeLevels = gradeLevelsResult.success
    ? (gradeLevelsResult.data ?? [])
    : [];
  const teachers = teachersResult.success ? teachersResult.data : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {t("editSchoolClass")} &ndash; {result.data.name}
      </h1>
      <EditSchoolClassPageForm
        schoolClass={result.data}
        gradeLevels={gradeLevels}
        teachers={teachers}
      />
    </div>
  );
};

export default EditSchoolClassPage;
