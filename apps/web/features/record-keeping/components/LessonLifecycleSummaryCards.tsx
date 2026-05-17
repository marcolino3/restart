"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Clock,
  Gauge,
  Hourglass,
  Rabbit,
  Target,
  Turtle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LifecycleAggregates } from "../lib/derive-lesson-lifecycle";

interface Props {
  aggregates: LifecycleAggregates;
}

type CardSpec = {
  key: string;
  icon: typeof Clock;
  label: string;
  value: string;
  hint?: string;
  accent?: "neutral" | "emerald" | "amber" | "sky" | "rose";
};

const accentMap: Record<NonNullable<CardSpec["accent"]>, string> = {
  neutral: "text-foreground",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  sky: "text-sky-600",
  rose: "text-rose-600",
};

export function LessonLifecycleSummaryCards({ aggregates }: Props) {
  const t = useTranslations("RecordKeeping");

  const fmtDays = (n: number | null): string =>
    n === null ? "—" : `${n} ${t("daysShort")}`;

  const masteryRatio =
    aggregates.trackedCount > 0
      ? Math.round(
          (aggregates.masteredCount / aggregates.trackedCount) * 100,
        )
      : 0;

  const cards: CardSpec[] = [
    {
      key: "tracked",
      icon: Target,
      label: t("trackedLessons"),
      value: String(aggregates.trackedCount),
    },
    {
      key: "mastered",
      icon: CheckCircle2,
      label: t("currentlyMastered"),
      value: `${aggregates.masteredCount} (${masteryRatio}%)`,
      accent: "emerald",
    },
    {
      key: "introToPracticed",
      icon: Clock,
      label: t("avgIntroToPracticed"),
      value: fmtDays(aggregates.avgDaysIntroToPracticed),
      accent: "sky",
    },
    {
      key: "practicedToMastered",
      icon: Hourglass,
      label: t("avgPracticedToMastered"),
      value: fmtDays(aggregates.avgDaysPracticedToMastered),
      accent: "amber",
    },
    {
      key: "introToMastered",
      icon: Gauge,
      label: t("avgIntroToMastered"),
      value: fmtDays(aggregates.avgDaysIntroToMastered),
      accent: "emerald",
    },
  ];

  if (aggregates.fastestMastery) {
    cards.push({
      key: "fastest",
      icon: Rabbit,
      label: t("fastestMastery"),
      value: fmtDays(aggregates.fastestMastery.days),
      hint: aggregates.fastestMastery.lessonName,
      accent: "emerald",
    });
  }
  if (aggregates.slowestMastery) {
    cards.push({
      key: "slowest",
      icon: Turtle,
      label: t("slowestMastery"),
      value: fmtDays(aggregates.slowestMastery.days),
      hint: aggregates.slowestMastery.lessonName,
      accent: "rose",
    });
  }

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.key} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xl font-semibold tabular-nums",
                      accentMap[c.accent ?? "neutral"],
                    )}
                  >
                    {c.value}
                  </p>
                  {c.hint && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {c.hint}
                    </p>
                  )}
                </div>
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    accentMap[c.accent ?? "neutral"],
                    "opacity-70",
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
