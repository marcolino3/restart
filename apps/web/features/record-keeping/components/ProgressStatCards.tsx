"use client";

import { useLocale, useTranslations } from "next-intl";

import { StatCard, StatCardEm } from "@/components/common/StatCard";
import type { MyLessonRecordStats } from "../actions/get-my-lesson-record-stats.action";

interface Props {
  stats: MyLessonRecordStats;
}

const formatTime = (iso: string, locale: string): string => {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/** Stat-card row for the Fortschritte overview (design handoff `.stats`). */
export function ProgressStatCards({ stats }: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();

  const lastRecordedLabel = stats.lastRecordedAt
    ? formatTime(stats.lastRecordedAt, locale)
    : "—";

  return (
    <div className="grid grid-cols-2 gap-6 divide-x rounded-card border bg-card px-6 py-5 shadow-card sm:grid-cols-3 lg:grid-cols-5 [&>*:not(:first-child)]:pl-6">
      <StatCard bare label={t("statTodayCount")} value={stats.todayCount} />
      <StatCard
        bare
        inline
        label={t("statWeekCount")}
        value={stats.weekCount}
        sub={
          stats.weekDelta !== 0 ? (
            <StatCardEm>
              {stats.weekDelta > 0 ? "+" : ""}
              {stats.weekDelta}
            </StatCardEm>
          ) : undefined
        }
      />
      <StatCard
        bare
        label={t("statStudentsReached")}
        value={stats.studentsReached}
      />
      <StatCard bare label={t("statLessonsCount")} value={stats.lessonsCount} />
      <StatCard bare label={t("statLastRecordedAt")} value={lastRecordedLabel} />
    </div>
  );
}
