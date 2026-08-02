import { getTranslations } from "next-intl/server";

import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { getClassroomAttentionAction } from "../actions/get-classroom-attention.action";
import { getClassroomHeatmapAction } from "../actions/get-classroom-heatmap.action";
import { RecordKeepingClassPicker } from "./RecordKeepingClassPicker";
import { ClassroomTabs } from "./ClassroomTabs";

interface Props {
  locale: string;
  classId?: string;
  subtab?: string;
}

/**
 * "Klassenübersicht" tab content: class picker + the existing attention/
 * heatmap/engagement tabs, reused as-is rather than rebuilt — they already
 * cover everything the design's second tab needs.
 */
export async function ClassroomOverviewTab({
  locale,
  classId,
  subtab,
}: Props) {
  const t = await getTranslations("RecordKeeping");

  const classesRes = await getMyTeachingSchoolClassesAction();
  const classes = classesRes.success
    ? classesRes.data
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ id: c.id, name: c.name }))
    : [];

  const selectedClassId =
    classId && classes.some((c) => c.id === classId) ? classId : classes[0]?.id;

  if (!selectedClassId) {
    return (
      <div className="flex flex-col gap-4">
        <RecordKeepingClassPicker classes={classes} />
        <p className="text-sm text-muted-foreground italic">
          {t("selectClassroomFirst")}
        </p>
      </div>
    );
  }

  const [heatmapRes, attentionRes] = await Promise.all([
    getClassroomHeatmapAction(selectedClassId, locale),
    getClassroomAttentionAction(selectedClassId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <RecordKeepingClassPicker classes={classes} />
      <ClassroomTabs
        schoolClassId={selectedClassId}
        locale={locale}
        initialHeatmap={heatmapRes.success ? heatmapRes.data : null}
        initialAttention={attentionRes.success ? attentionRes.data : null}
        initialTab={subtab ?? "attention"}
      />
    </div>
  );
}
