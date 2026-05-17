import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { getClassroomHeatmapAction } from "@/features/record-keeping/actions/get-classroom-heatmap.action";
import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { ClassroomHeatmap } from "@/features/record-keeping/components/ClassroomHeatmap";

interface PageProps {
  searchParams: Promise<{ classId?: string }>;
}

const HeatmapBody = async ({
  schoolClassId,
  locale,
  fallbackError,
}: {
  schoolClassId: string;
  locale: string;
  fallbackError: string;
}) => {
  const heatmapRes = await getClassroomHeatmapAction(schoolClassId, locale);
  if (!heatmapRes.success) {
    return (
      <p className="text-sm text-destructive">
        {heatmapRes.error ?? fallbackError}
      </p>
    );
  }
  return <ClassroomHeatmap data={heatmapRes.data} />;
};

const HeatmapSkeleton = () => (
  <div className="flex flex-col gap-2 animate-pulse">
    <div className="h-6 w-48 rounded bg-muted" />
    <div className="grid grid-cols-6 gap-1">
      {Array.from({ length: 36 }).map((_, i) => (
        <div key={i} className="h-10 rounded bg-muted" />
      ))}
    </div>
  </div>
);

const HeatmapPage = async ({ searchParams }: PageProps) => {
  const { classId } = await searchParams;
  const t = await getTranslations("RecordKeeping");
  const locale = await getLocale();

  const classesRes = await getMyTeachingSchoolClassesAction();
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t("heatmapTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("heatmapSubtitle")}</p>
      </div>

      {!selectedClassId ? (
        <p className="text-sm text-muted-foreground italic">
          {t("selectClassroomFirst")}
        </p>
      ) : (
        <Suspense key={selectedClassId} fallback={<HeatmapSkeleton />}>
          <HeatmapBody
            schoolClassId={selectedClassId}
            locale={locale}
            fallbackError="Failed to load"
          />
        </Suspense>
      )}
    </div>
  );
};

export default HeatmapPage;
