import { getStudentsAction } from "@/features/students/actions/get-students.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { StudentsTable } from "@/features/students/components/StudentsTable";
import { StudentsCsvUpload } from "@/features/students/components/StudentsCsvUpload";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { LayoutGrid, PlusIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

const StudentsPage = async () => {
  const t = await getTranslations("Students");
  const tC = await getTranslations("Common");
  const tK = await getTranslations("StudentsKanban");
  const locale = await getLocale();
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{t("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const { success, data } = await getStudentsAction();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("students")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={ROUTES.admin.studentsKanban(locale)}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              {tK("openKanban")}
            </Link>
          </Button>
          <StudentsCsvUpload />
          <Button asChild>
            <Link href={ROUTES.admin.studentsCreate(locale)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {tC("createStudent")}
            </Link>
          </Button>
        </div>
      </div>
      {success && data && data.length > 0 ? (
        <StudentsTable data={data} />
      ) : (
        <p className="text-muted-foreground">{t("noStudentsFound")}</p>
      )}
    </div>
  );
};

export default StudentsPage;
