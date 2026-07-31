import { getSchoolClassByIdAction } from "@/features/school-classes/actions/get-school-class-by-id.action";
import { getGradeLevelsAction } from "@/features/grade-levels/actions/get-grade-levels.action";
import { getTeachersAction } from "@/features/school-classes/actions/get-teachers.action";
import { getSchoolYearAction } from "@/features/school-classes/actions/get-school-year.action";
import EditSchoolClassPageForm from "@/features/school-classes/components/EditSchoolClassPageForm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ schoolClassId: string }>;
}

const EditSchoolClassPage = async ({ params }: Props) => {
  const { schoolClassId } = await params;
  const t = await getTranslations("SchoolClasses");

  const [result, gradeLevelsResult, teachersResult, schoolYearResult] =
    await Promise.all([
      getSchoolClassByIdAction(schoolClassId),
      getGradeLevelsAction(),
      getTeachersAction(),
      getSchoolYearAction(),
    ]);

  if (!result.success || !result.data) {
    notFound();
  }

  const gradeLevels = gradeLevelsResult.success
    ? (gradeLevelsResult.data ?? [])
    : [];
  const teachers = teachersResult.success ? teachersResult.data : [];
  // Purely a label — the page still renders if the lookup fails.
  const schoolYearLabel = schoolYearResult.success
    ? schoolYearResult.data.label
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{result.data.name}</h1>
        <p className="text-sm text-muted-foreground">
          {[
            t("editSchoolClass"),
            schoolYearLabel && `${t("schoolYear")} ${schoolYearLabel}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <EditSchoolClassPageForm
        schoolClass={result.data}
        gradeLevels={gradeLevels}
        teachers={teachers}
        schoolYearLabel={schoolYearLabel}
      />
    </div>
  );
};

export default EditSchoolClassPage;
