import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getLessonsForOrgAction } from "@/features/record-keeping/actions/get-lessons-for-org.action";
import { getSchoolClassesAction } from "@/features/school-classes/actions/get-school-classes.action";
import { LessonFirstBulkEntry } from "@/features/record-keeping/components/LessonFirstBulkEntry";

const RecordKeepingPage = async () => {
  const t = await getTranslations("RecordKeeping");
  const locale = await getLocale();

  const [lessonsRes, classroomsRes] = await Promise.all([
    getLessonsForOrgAction(),
    getSchoolClassesAction(),
  ]);

  const lessons = lessonsRes.success ? lessonsRes.data : [];
  const classrooms = classroomsRes.success
    ? classroomsRes.data
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ id: c.id, name: c.name }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button variant="outline" asChild>
          <Link href={ROUTES.admin.recordKeepingHeatmap(locale)}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            {t("openHeatmap")}
          </Link>
        </Button>
      </div>
      <LessonFirstBulkEntry lessons={lessons} classrooms={classrooms} />
    </div>
  );
};

export default RecordKeepingPage;
