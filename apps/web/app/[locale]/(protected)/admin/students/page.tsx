import { getStudentsAction } from "@/features/students/actions/get-students.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { StudentsTable } from "@/features/students/components/StudentsTable";
import { StudentsCsvUpload } from "@/features/students/components/StudentsCsvUpload";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/common/PageHead";
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

  const activeCount = (data ?? []).filter((s) => s.isActive).length;

  return (
    <div>
      <PageHead
        title={t("students")}
        subtitle={
          data && data.length > 0
            ? tC("activeSubtitle", { count: activeCount })
            : undefined
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={ROUTES.admin.studentsKanban(locale)}>
                <LayoutGrid />
                {tK("openKanban")}
              </Link>
            </Button>
            <StudentsCsvUpload />
            <Button asChild>
              <Link href={ROUTES.admin.studentsCreate(locale)}>
                <PlusIcon />
                {tC("createStudent")}
              </Link>
            </Button>
          </div>
        }
      />
      {success && data && data.length > 0 ? (
        <StudentsTable data={data} />
      ) : (
        <p className="text-muted-foreground">{t("noStudentsFound")}</p>
      )}
    </div>
  );
};

export default StudentsPage;
