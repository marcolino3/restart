"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Hourglass,
  Minus,
  Repeat2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LessonLifecycle } from "../lib/derive-lesson-lifecycle";
import type { AreaLessonCount } from "../actions/get-area-lesson-counts.action";
import { LessonLifecycleList } from "./LessonLifecycleList";

interface Props {
  lifecycles: LessonLifecycle[];
  areaLessonCounts?: AreaLessonCount[];
}

const STATUS_COLOR = {
  PRACTICED: "#f59e0b",
  MASTERED: "#10b981",
  NEEDS_MORE: "#f43f5e",
  INTRODUCED: "#0ea5e9",
} as const;

const today = () => new Date().toISOString().slice(0, 10);

const daysBetween = (later: string, earlier: string): number => {
  const a = new Date(earlier + "T00:00:00Z").getTime();
  const b = new Date(later + "T00:00:00Z").getTime();
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
};

const avg = (xs: number[]): number | null =>
  xs.length === 0 ? null : Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

export function LessonLifecycleInsights({
  lifecycles,
  areaLessonCounts = [],
}: Props) {
  const t = useTranslations("RecordKeeping");
  const [showDetailList, setShowDetailList] = useState(false);

  // ─── KPIs ───────────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const now = today();

    // "Aktiv in Übung": currently in PRACTICED state and not yet mastered.
    const activelyPracticing = lifecycles.filter(
      (l) => l.currentStatus === "PRACTICED" && !l.masteredAt,
    );

    // Re-input quote: share of lessons with ≥1 NEEDS_MORE event in history.
    const lessonsWithReinput = lifecycles.filter((l) =>
      l.history.some((h) => h.status === "NEEDS_MORE"),
    );
    const reInputRatio =
      lifecycles.length === 0
        ? 0
        : Math.round((lessonsWithReinput.length / lifecycles.length) * 100);

    // Re-input intensity per lesson (distribution: 0, 1, 2, 3+).
    const reInputBuckets: Record<"0" | "1" | "2" | "3+", number> = {
      "0": 0,
      "1": 0,
      "2": 0,
      "3+": 0,
    };
    for (const l of lifecycles) {
      const n = l.history.filter((h) => h.status === "NEEDS_MORE").length;
      const key = n === 0 ? "0" : n === 1 ? "1" : n === 2 ? "2" : "3+";
      reInputBuckets[key]++;
    }
    const reInputDist: { label: string; count: number }[] = [
      { label: "0", count: reInputBuckets["0"] },
      { label: "1", count: reInputBuckets["1"] },
      { label: "2", count: reInputBuckets["2"] },
      { label: "3+", count: reInputBuckets["3+"] },
    ];

    // Longest currently-open practice phase.
    let longestOpenPractice: {
      lessonName: string;
      days: number;
    } | null = null;
    for (const l of activelyPracticing) {
      if (!l.practicedAt) continue;
      const d = daysBetween(now, l.practicedAt);
      if (!longestOpenPractice || d > longestOpenPractice.days) {
        longestOpenPractice = { lessonName: l.lessonName, days: d };
      }
    }

    // Tempo trend: split mastered lessons by mastery order (first half vs
    // second half) and compare avg days-to-mastery. Trend < 0 = getting
    // faster, > 0 = getting slower.
    const masteredSorted = lifecycles
      .filter(
        (l): l is LessonLifecycle & { masteredAt: string } =>
          l.masteredAt !== null && l.daysIntroToMastered !== null,
      )
      .sort((a, b) => a.masteredAt.localeCompare(b.masteredAt));
    let tempoTrend: {
      firstAvg: number;
      lastAvg: number;
      deltaDays: number;
    } | null = null;
    if (masteredSorted.length >= 4) {
      const half = Math.floor(masteredSorted.length / 2);
      const firstAvg = avg(
        masteredSorted.slice(0, half).map((l) => l.daysIntroToMastered!),
      )!;
      const lastAvg = avg(
        masteredSorted.slice(masteredSorted.length - half).map(
          (l) => l.daysIntroToMastered!,
        ),
      )!;
      tempoTrend = { firstAvg, lastAvg, deltaDays: lastAvg - firstAvg };
    }

    // Avg pace per AREA (intro → mastered). AREAs without any mastered
    // lesson are skipped — we can't compute a pace without it. Areas
    // merged by translated name to handle duplicate-named curriculum AREAs.
    const byAreaName = new Map<
      string,
      { name: string; days: number[]; count: number }
    >();
    for (const l of masteredSorted) {
      const name = l.areaName ?? "—";
      const key = name.toLocaleLowerCase().trim();
      let bucket = byAreaName.get(key);
      if (!bucket) {
        bucket = { name, days: [], count: 0 };
        byAreaName.set(key, bucket);
      }
      bucket.days.push(l.daysIntroToMastered!);
      bucket.count++;
    }
    const areaPace = Array.from(byAreaName.values())
      .map((b) => ({
        name: b.name,
        avgDays: avg(b.days)!,
        count: b.count,
      }))
      .sort((a, b) => a.avgDays - b.avgDays);

    // Top N "stuck in practice": currently in PRACTICED, sorted by how
    // long they've been there.
    const stuckLessons = activelyPracticing
      .filter((l) => l.practicedAt)
      .map((l) => ({
        lessonId: l.lessonId,
        lessonName: l.lessonName,
        areaName: l.areaName,
        days: daysBetween(now, l.practicedAt!),
        reInputs: l.history.filter((h) => h.status === "NEEDS_MORE").length,
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    // Avg re-inputs per lesson (only over lessons that had any progression).
    const reInputsPerActiveLesson = lifecycles.filter(
      (l) => l.introducedAt !== null,
    );
    const totalReInputs = reInputsPerActiveLesson.reduce(
      (sum, l) =>
        sum + l.history.filter((h) => h.status === "NEEDS_MORE").length,
      0,
    );
    const avgReInputsPerLesson =
      reInputsPerActiveLesson.length === 0
        ? 0
        : (totalReInputs / reInputsPerActiveLesson.length).toFixed(1);

    return {
      activelyPracticingCount: activelyPracticing.length,
      reInputRatio,
      reInputDist,
      avgReInputsPerLesson,
      longestOpenPractice,
      tempoTrend,
      areaPace,
      stuckLessons,
      masteredCount: masteredSorted.length,
    };
  }, [lifecycles]);

  if (lifecycles.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground italic">
          {t("noLifecycleData")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Activity}
          label={t("kpiActivelyPracticing")}
          value={String(insights.activelyPracticingCount)}
          hint={t("kpiActivelyPracticingHint")}
          accent="amber"
        />
        <KpiCard
          icon={Repeat2}
          label={t("kpiReinputRatio")}
          value={`${insights.reInputRatio}%`}
          hint={t("kpiReinputRatioHint", {
            avg: insights.avgReInputsPerLesson,
          })}
          accent={insights.reInputRatio > 30 ? "rose" : "neutral"}
        />
        <KpiCard
          icon={Hourglass}
          label={t("kpiLongestOpenPractice")}
          value={
            insights.longestOpenPractice
              ? `${insights.longestOpenPractice.days} ${t("daysShort")}`
              : "—"
          }
          hint={insights.longestOpenPractice?.lessonName ?? t("kpiNoneOpen")}
          accent={
            (insights.longestOpenPractice?.days ?? 0) > 30 ? "rose" : "neutral"
          }
        />
        <TempoTrendCard
          trend={insights.tempoTrend}
          tFaster={t("kpiTempoFaster")}
          tSlower={t("kpiTempoSlower")}
          tSteady={t("kpiTempoSteady")}
          tNotEnough={t("kpiTempoNotEnough")}
          tLabel={t("kpiTempoTrend")}
          tDays={t("daysShort")}
        />
      </div>

      {/* ─── Charts ───────────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {/* Per-Area pace */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("areaPaceTitle")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("areaPaceSubtitle")}
            </p>
          </CardHeader>
          <CardContent>
            {insights.areaPace.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {t("chartNoMasteryYet")}
              </p>
            ) : (
              <div
                className="w-full"
                style={{
                  height: `${Math.max(160, insights.areaPace.length * 32)}px`,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={insights.areaPace}
                    layout="vertical"
                    margin={{ top: 4, right: 20, bottom: 4, left: 8 }}
                  >
                    <CartesianGrid
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const count = (item as { payload?: { count?: number } })
                          ?.payload?.count;
                        return [
                          `${value} ${t("daysShort")} · ${count ?? 0} ${t("trackedLessons")}`,
                          t("kpiTempoTrend"),
                        ];
                      }}
                      contentStyle={{ fontSize: 11 }}
                    />
                    <Bar
                      dataKey="avgDays"
                      fill={STATUS_COLOR.MASTERED}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Re-Input distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("reinputDistTitle")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("reinputDistSubtitle")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insights.reInputDist}
                  margin={{ top: 8, right: 8, bottom: 4, left: -10 }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(value) => [
                      String(value),
                      t("trackedLessons"),
                    ]}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar
                    dataKey="count"
                    fill={STATUS_COLOR.NEEDS_MORE}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Stuck in practice list ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {t("stuckListTitle")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("stuckListSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          {insights.stuckLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {t("kpiNoneOpen")}
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {insights.stuckLessons.map((s) => (
                <li
                  key={s.lessonId}
                  className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
                >
                  <span className="text-sm font-semibold tabular-nums text-amber-700 w-16 shrink-0">
                    {s.days} {t("daysShort")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.lessonName}
                    </p>
                    {s.areaName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {s.areaName}
                      </p>
                    )}
                  </div>
                  {s.reInputs > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-rose-50 text-rose-700 border-rose-200"
                    >
                      {s.reInputs}× {t("NEEDS_MORE")}
                    </Badge>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* ─── Optional per-lesson detail (collapsed) ────────────────────── */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDetailList((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {showDetailList ? (
            <ChevronDown className="h-3.5 w-3.5 mr-1" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 mr-1" />
          )}
          {showDetailList ? t("hideDetailList") : t("showDetailList")}
        </Button>
        {showDetailList && (
          <div className="mt-3">
            <LessonLifecycleList
              lifecycles={lifecycles}
              areaLessonCounts={areaLessonCounts}
            />
          </div>
        )}
      </div>
    </div>
  );

  function KpiCard({
    icon: Icon,
    label,
    value,
    hint,
    accent = "neutral",
  }: {
    icon: typeof Activity;
    label: string;
    value: string;
    hint?: string;
    accent?: "neutral" | "amber" | "rose" | "emerald";
  }) {
    const accentCls = {
      neutral: "text-foreground",
      amber: "text-amber-600",
      rose: "text-rose-600",
      emerald: "text-emerald-600",
    }[accent];
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {label}
              </p>
              <p
                className={cn(
                  "mt-1 text-xl font-semibold tabular-nums",
                  accentCls,
                )}
              >
                {value}
              </p>
              {hint && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {hint}
                </p>
              )}
            </div>
            <Icon className={cn("h-5 w-5 flex-shrink-0 opacity-70", accentCls)} />
          </div>
        </CardContent>
      </Card>
    );
  }
}

function TempoTrendCard({
  trend,
  tFaster,
  tSlower,
  tSteady,
  tNotEnough,
  tLabel,
  tDays,
}: {
  trend: { firstAvg: number; lastAvg: number; deltaDays: number } | null;
  tFaster: string;
  tSlower: string;
  tSteady: string;
  tNotEnough: string;
  tLabel: string;
  tDays: string;
}) {
  let icon = Minus;
  let accent: "neutral" | "emerald" | "rose" = "neutral";
  let value = "—";
  let hint = tNotEnough;
  if (trend) {
    const abs = Math.abs(trend.deltaDays);
    if (abs <= 1) {
      icon = Minus;
      value = tSteady;
      hint = `${trend.firstAvg} → ${trend.lastAvg} ${tDays}`;
    } else if (trend.deltaDays < 0) {
      icon = ArrowDownRight;
      accent = "emerald";
      value = `${tFaster} ${abs} ${tDays}`;
      hint = `${trend.firstAvg} → ${trend.lastAvg} ${tDays}`;
    } else {
      icon = ArrowUpRight;
      accent = "rose";
      value = `${tSlower} ${abs} ${tDays}`;
      hint = `${trend.firstAvg} → ${trend.lastAvg} ${tDays}`;
    }
  }
  const Icon = icon;
  const accentCls = {
    neutral: "text-foreground",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
  }[accent];
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground line-clamp-2">{tLabel}</p>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tabular-nums truncate",
                accentCls,
              )}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>
          </div>
          <Icon className={cn("h-5 w-5 flex-shrink-0 opacity-70", accentCls)} />
        </div>
      </CardContent>
    </Card>
  );
}
