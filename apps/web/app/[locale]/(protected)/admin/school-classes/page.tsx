import { getTranslations } from "next-intl/server";

import { getSchoolClassesAction } from "@/features/school-classes/actions/get-school-classes.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { SchoolClassesCardGrid } from "@/features/school-classes/components/SchoolClassesCardGrid";

const SchoolClassesPage = async () => {
  const t = await getTranslations("SchoolClasses");
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const classesResult = await getSchoolClassesAction();
  const classes =
    classesResult.success && classesResult.data ? classesResult.data : [];

  return <SchoolClassesCardGrid schoolClasses={classes} />;
};

export default SchoolClassesPage;
