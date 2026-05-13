import { getTranslations } from "next-intl/server";
import { CurriculumForm } from "@/features/curricula/components/CurriculumForm";

const NewCurriculumPage = async () => {
  const t = await getTranslations("Curricula");
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t("createCurriculum")}</h1>
      <CurriculumForm />
    </div>
  );
};

export default NewCurriculumPage;
