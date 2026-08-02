import { getTranslations } from "next-intl/server";

import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { getClassroomAttentionAction } from "../actions/get-classroom-attention.action";
import { getClassroomHeatmapAction } from "../actions/get-classroom-heatmap.action";
import { RecordKeepingClassPicker } from "./RecordKeepingClassPicker";
import { ClassroomHeatmap } from "./ClassroomHeatmap";
import { StudentAttentionList } from "./StudentAttentionList";

interface Props {
  locale: string;
  classId?: string;
}

/**
 * "Klassenübersicht" tab content: class picker + attention list + heatmap,
 * reused as-is from the standalone /attention and /heatmap pages.
 */
export async function ClassroomOverviewTab({
  locale,
  classId,
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
      {attentionRes.success && attentionRes.data.length > 0 ? (
        <StudentAttentionList summaries={attentionRes.data} />
      ) : null}
      {heatmapRes.success ? (
        <ClassroomHeatmap data={heatmapRes.data} />
      ) : (
        <p className="text-sm text-destructive">{heatmapRes.error}</p>
      )}
    </div>
  );
}
