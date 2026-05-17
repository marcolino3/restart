import { getTranslations } from "next-intl/server";

import { getClassroomAttentionAction } from "@/features/record-keeping/actions/get-classroom-attention.action";
import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";
import { StudentAttentionList } from "@/features/record-keeping/components/StudentAttentionList";

interface PageProps {
  searchParams: Promise<{ classId?: string }>;
}

const AttentionPage = async ({ searchParams }: PageProps) => {
  const { classId } = await searchParams;
  const t = await getTranslations("RecordKeeping");

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

  const attentionRes = selectedClassId
    ? await getClassroomAttentionAction(selectedClassId)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t("attentionOrgTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("attentionOrgSubtitle")}
        </p>
      </div>

      {!selectedClassId ? (
        <p className="text-sm text-muted-foreground italic">
          {t("selectClassroomFirst")}
        </p>
      ) : !attentionRes?.success ? (
        <p className="text-sm text-destructive">
          {attentionRes?.error ?? "Failed to load"}
        </p>
      ) : attentionRes.data.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          {t("attentionNoData")}
        </p>
      ) : (
        <StudentAttentionList summaries={attentionRes.data} />
      )}
    </div>
  );
};

export default AttentionPage;
