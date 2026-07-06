import { getLocale, getTranslations } from "next-intl/server";

import { PageHead } from "@/components/common/PageHead";
import { StatCard } from "@/components/common/StatCard";
import { getAdmissionsDataAction } from "@/features/admissions-kanban/actions/get-admissions-data.action";
import { getOrgAdmissionRemindersAction } from "@/features/admissions-kanban/actions/get-org-admission-reminders.action";
import { DashboardAdmissionStagesPanel } from "@/features/dashboard/components/DashboardAdmissionStagesPanel";
import { DashboardAttentionPanel } from "@/features/dashboard/components/DashboardAttentionPanel";
import { getClassroomAttentionAction } from "@/features/record-keeping/actions/get-classroom-attention.action";
import { getClassroomHeatmapAction } from "@/features/record-keeping/actions/get-classroom-heatmap.action";
import { getSchoolClassesAction } from "@/features/school-classes/actions/get-school-classes.action";
import { getStudentsAction } from "@/features/students/actions/get-students.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

const TIME_ZONE = "Europe/Zurich";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Time-of-day dependent greeting key (design handoff: "Guten Morgen, Anna"). */
function greetingKey(hour: number) {
  if (hour >= 5 && hour < 11) return "greetingMorning" as const;
  if (hour >= 11 && hour < 18) return "greetingAfternoon" as const;
  return "greetingEvening" as const;
}

export default async function DashboardPage() {
  const [t, locale, userRes] = await Promise.all([
    getTranslations("Dashboard"),
    getLocale(),
    getCurrentUserAction(),
  ]);

  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: TIME_ZONE,
    }).format(now)
  );
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(now);

  const firstName = userRes?.data?.user?.firstName ?? "";
  const head = (
    <PageHead
      stacked
      title={t(greetingKey(hour), { name: firstName })}
      subtitle={t("subtitle", { date: dateLabel })}
    />
  );

  // SuperAdmin may land here without an active org — no org-scoped data then.
  if (!userRes?.data?.orgId) {
    return (
      <div>
        {head}
        <p className="text-sm text-muted-foreground italic">{t("noOrgHint")}</p>
      </div>
    );
  }

  const [studentsRes, classesRes, admissionsRes, remindersRes] =
    await Promise.all([
      getStudentsAction(),
      getSchoolClassesAction(),
      getAdmissionsDataAction(),
      getOrgAdmissionRemindersAction("OPEN"),
    ]);

  const activeClasses = (classesRes.success ? classesRes.data : []).filter(
    (c) => c.isActive
  );

  // Attention + mastered rate are per-classroom queries — fan out over the
  // active classes (both actions are cached via unstable_cache tags).
  const [attentionResults, heatmapResults] = await Promise.all([
    Promise.all(activeClasses.map((c) => getClassroomAttentionAction(c.id))),
    Promise.all(
      activeClasses.map((c) => getClassroomHeatmapAction(c.id, locale))
    ),
  ]);

  const attentionSummaries = attentionResults
    .flatMap((r) => (r.success ? r.data : []))
    .sort(
      (a, b) =>
        (b.topItems[0]?.severity ?? 0) - (a.topItems[0]?.severity ?? 0) ||
        b.totalSignals - a.totalSignals
    );

  let masteredCount = 0;
  let recordedCount = 0;
  for (const r of heatmapResults) {
    if (!r.success) continue;
    for (const row of Object.values(r.data.cells)) {
      for (const cell of Object.values(row)) {
        masteredCount += cell.byStatus.MASTERED;
        recordedCount += cell.total;
      }
    }
  }

  const activeStudents = studentsRes.success
    ? studentsRes.data.filter((s) => s.isActive).length
    : null;

  const activeApplications = admissionsRes.success
    ? admissionsRes.data.applications.filter((a) => a.status === "ACTIVE")
    : [];
  // "New this week" ≈ still in the default (intake) stage and entered it
  // within the last 7 days — the applications query has no createdAt.
  const defaultStageId = admissionsRes.success
    ? (admissionsRes.data.stages.find((s) => s.isDefault) ??
        admissionsRes.data.stages[0])?.id
    : undefined;
  const newThisWeek = activeApplications.filter(
    (a) =>
      a.admissionStageId === defaultStageId &&
      now.getTime() - new Date(a.stageEnteredAt).getTime() < WEEK_MS
  ).length;

  const openReminders = remindersRes.success ? remindersRes.data : [];
  const overdueReminders = openReminders.filter(
    (r) => new Date(r.dueAt).getTime() < now.getTime()
  ).length;

  return (
    <div>
      {head}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("statStudents")}
          value={activeStudents ?? "—"}
          sub={t("statStudentsSub", { count: activeClasses.length })}
        />
        <StatCard
          label={t("statApplications")}
          value={admissionsRes.success ? activeApplications.length : "—"}
          sub={t("statApplicationsSub", { count: newThisWeek })}
        />
        <StatCard
          label={t("statReminders")}
          value={remindersRes.success ? openReminders.length : "—"}
          sub={t("statRemindersSub", { count: overdueReminders })}
        />
        <StatCard
          label={t("statMastered")}
          value={
            recordedCount > 0
              ? `${Math.round((masteredCount / recordedCount) * 100)}%`
              : "—"
          }
          sub={
            recordedCount > 0
              ? t("statMasteredSub", {
                  mastered: masteredCount,
                  total: recordedCount,
                })
              : t("statMasteredEmpty")
          }
        />
      </div>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <DashboardAttentionPanel summaries={attentionSummaries} />
        {admissionsRes.success && (
          <DashboardAdmissionStagesPanel data={admissionsRes.data} />
        )}
      </div>
    </div>
  );
}
