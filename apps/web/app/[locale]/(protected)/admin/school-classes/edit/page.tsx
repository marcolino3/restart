import CreateSchoolClassPageForm from "@/features/school-classes/components/CreateSchoolClassPageForm";
import { getGradeLevelsAction } from "@/features/school-classes/actions/get-grade-levels.action";
import { getTranslations } from "next-intl/server";

export default async function CreateSchoolClassPage() {
  const t = await getTranslations("SchoolClasses");
  const gradeLevelsResult = await getGradeLevelsAction();
  const gradeLevels = gradeLevelsResult.success
    ? (gradeLevelsResult.data ?? [])
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("createSchoolClass")}</h1>
      <CreateSchoolClassPageForm gradeLevels={gradeLevels} />
    </div>
  );
}
