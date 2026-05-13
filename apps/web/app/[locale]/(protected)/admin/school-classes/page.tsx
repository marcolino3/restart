import { getSchoolClassesAction } from "@/features/school-classes/actions/get-school-classes.action";
import { getGradeLevelsAction } from "@/features/school-classes/actions/get-grade-levels.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { SchoolClassesTable } from "@/features/school-classes/components/SchoolClassesTable";
import { ManageGradeLevelsDialog } from "@/features/school-classes/components/ManageGradeLevelsDialog";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

const SchoolClassesPage = async () => {
  const t = await getTranslations("SchoolClasses");
  const tC = await getTranslations("Common");
  const locale = await getLocale();
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const [classesResult, gradeLevelsResult] = await Promise.all([
    getSchoolClassesAction(),
    getGradeLevelsAction(),
  ]);

  const gradeLevels = gradeLevelsResult.success
    ? (gradeLevelsResult.data ?? [])
    : [];

  const classes =
    classesResult.success && classesResult.data ? classesResult.data : [];

  // Collect all grade level IDs that are assigned to at least one class
  const usedGradeLevelIds = new Set(
    classes.flatMap((c) => c.gradeLevels?.map((gl) => gl.id) ?? [])
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("schoolClasses")}</h1>
        <div className="flex items-center gap-2">
          <ManageGradeLevelsDialog
            gradeLevels={gradeLevels}
            usedGradeLevelIds={usedGradeLevelIds}
          />
          <Button asChild>
            <Link href={ROUTES.admin.schoolClassesCreate(locale)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {tC("createSchoolClass")}
            </Link>
          </Button>
        </div>
      </div>
      {classes.length > 0 ? (
        <SchoolClassesTable data={classes} />
      ) : (
        <p className="text-muted-foreground">{t("noSchoolClassesFound")}</p>
      )}
    </div>
  );
};

export default SchoolClassesPage;
