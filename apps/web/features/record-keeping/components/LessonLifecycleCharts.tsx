"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { LessonLifecycle } from "../lib/derive-lesson-lifecycle";
import type { LessonRecordStatus } from "../types";

interface Props {
  lifecycles: LessonLifecycle[];
}

const STATUS_COLOR: Record<LessonRecordStatus, string> = {
  PLANNING: "#94a3b8",
  INTRODUCED: "#0ea5e9",
  PRACTICED: "#f59e0b",
  MASTERED: "#10b981",
  NEEDS_MORE: "#f43f5e",
};

const STATUS_ORDER: LessonRecordStatus[] = [
  "MASTERED",
  "PRACTICED",
  "INTRODUCED",
  "PLANNING",
  "NEEDS_MORE",
];

// Day-to-mastery buckets — chosen to expose typical Montessori cycle lengths:
// fast (< 1 wk), normal (~ 1–4 wks), deep (~ 1–2 mo), long (> 2 mo).
const DURATION_BUCKETS: { label: string; max: number }[] = [
  { label: "0–7", max: 7 },
  { label: "8–14", max: 14 },
  { label: "15–30", max: 30 },
  { label: "31–60", max: 60 },
  { label: "60+", max: Number.POSITIVE_INFINITY },
];

export function LessonLifecycleCharts({ lifecycles }: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();

  // Status distribution — counts each lifecycle's `currentStatus`.
  const statusData = useMemo(() => {
    const counts: Record<LessonRecordStatus, number> = {
      PLANNING: 0,
      INTRODUCED: 0,
      PRACTICED: 0,
      MASTERED: 0,
      NEEDS_MORE: 0,
    };
    for (const l of lifecycles) counts[l.currentStatus]++;
    return STATUS_ORDER.map((s) => ({
      key: s,
      label: t(s),
      value: counts[s],
      color: STATUS_COLOR[s],
    })).filter((d) => d.value > 0);
  }, [lifecycles, t]);

  // Mastery timeline — cumulative count of MASTERED lessons by month.
  const masteryTimeline = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const l of lifecycles) {
      if (!l.masteredAt) continue;
      const month = l.masteredAt.slice(0, 7); // YYYY-MM
      byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
    }
    const months = Array.from(byMonth.keys()).sort();
    const monthFmt = new Intl.DateTimeFormat(
      locale === "de" ? "de-CH" : "en-GB",
      { month: "short", year: "2-digit" },
    );
    let running = 0;
    return months.map((m) => {
      running += byMonth.get(m) ?? 0;
      return {
        month: m,
        label: monthFmt.format(new Date(`${m}-01T00:00:00Z`)),
        cumulative: running,
        delta: byMonth.get(m) ?? 0,
      };
    });
  }, [lifecycles, locale]);

  // Days-to-mastery distribution — only lessons that actually got mastered.
  const durationData = useMemo(() => {
    const counts = DURATION_BUCKETS.map((b) => ({
      label: b.label,
      max: b.max,
      count: 0,
    }));
    for (const l of lifecycles) {
      if (l.daysIntroToMastered === null) continue;
      const bucket = counts.find((c) => l.daysIntroToMastered! <= c.max);
      if (bucket) bucket.count++;
    }
    return counts;
  }, [lifecycles]);

  const masteredTotal = lifecycles.filter((l) => l.masteredAt).length;

  if (lifecycles.length === 0) return null;

  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {/* Status distribution donut */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("chartStatusDistribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">—</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {statusData.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const v = Number(value);
                      const label = (item as { payload?: { label?: string } })
                        ?.payload?.label;
                      return [
                        `${v} (${Math.round((v / lifecycles.length) * 100)}%)`,
                        label ?? "",
                      ];
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cumulative mastered lessons over time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("chartMasteryTimeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          {masteryTimeline.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {t("chartNoMasteryYet")}
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={masteryTimeline}
                  margin={{ top: 8, right: 8, bottom: 0, left: -10 }}
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
                    formatter={(value, name) => [
                      String(value),
                      name === "cumulative"
                        ? t("chartCumulativeMastered")
                        : t("chartNewMastered"),
                    ]}
                    labelStyle={{ fontSize: 11 }}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke={STATUS_COLOR.MASTERED}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Days-to-mastery histogram */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {t("chartDaysToMasteryDist")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {masteredTotal === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {t("chartNoMasteryYet")}
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={durationData}
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
                    label={{
                      value: t("daysShort"),
                      position: "insideBottom",
                      offset: -2,
                      style: { fontSize: 10, fill: "#64748b" },
                    }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(value) => [String(value), t("trackedLessons")]}
                    labelStyle={{ fontSize: 11 }}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar
                    dataKey="count"
                    fill={STATUS_COLOR.MASTERED}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
