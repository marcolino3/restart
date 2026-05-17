import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

import { getClassroomHeatmapAction } from "@/features/record-keeping/actions/get-classroom-heatmap.action";
import { getSchoolClassesAction } from "@/features/school-classes/actions/get-school-classes.action";
import { ClassroomHeatmap } from "@/features/record-keeping/components/ClassroomHeatmap";
import { HeatmapClassPicker } from "@/features/record-keeping/components/HeatmapClassPicker";

interface PageProps {
  searchParams: Promise<{ classId?: string }>;
}

const HeatmapPage = async ({ searchParams }: PageProps) => {
  const { classId } = await searchParams;
  const t = await getTranslations("RecordKeeping");
  const locale = await getLocale();

  const classesRes = await getSchoolClassesAction();
  const classes = classesRes.success
    ? classesRes.data
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ id: c.id, name: c.name }))
    : [];

  const selectedClassId =
    classId && classes.some((c) => c.id === classId)
      ? classId
      : classes[0]?.id;

  const heatmap = selectedClassId
    ? await getClassroomHeatmapAction(selectedClassId, locale)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href={ROUTES.admin.recordKeeping(locale)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("title")}
        </Link>
      </Button>
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t("heatmapTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("heatmapSubtitle")}
          </p>
        </div>
        <HeatmapClassPicker classes={classes} selectedId={selectedClassId} />
      </div>

      {!selectedClassId ? (
        <p className="text-sm text-muted-foreground italic">
          {t("selectClassroomFirst")}
        </p>
      ) : !heatmap?.success ? (
        <p className="text-sm text-destructive">
          {heatmap?.error ?? "Failed to load"}
        </p>
      ) : (
        <ClassroomHeatmap data={heatmap.data} />
      )}
    </div>
  );
};

export default HeatmapPage;
