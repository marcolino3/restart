import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getKanbanDataAction } from "@/features/students-kanban/actions/get-kanban-data.action";
import { StudentsKanban } from "@/features/students-kanban/components/StudentsKanban";

const StudentsKanbanPage = async () => {
  const t = await getTranslations("StudentsKanban");
  const locale = await getLocale();

  const res = await getKanbanDataAction();
  if (!res.success) {
    return (
      <div className="text-sm text-destructive">
        {res.error ?? "Failed to load"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href={ROUTES.admin.students(locale)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("backToStudents")}
        </Link>
      </Button>
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <StudentsKanban
        initialClassrooms={res.data.classrooms}
        initialUnassigned={res.data.unassigned}
        initialStudentsById={res.data.studentsById}
        gradeLevels={res.data.gradeLevels}
      />
    </div>
  );
};

export default StudentsKanbanPage;
