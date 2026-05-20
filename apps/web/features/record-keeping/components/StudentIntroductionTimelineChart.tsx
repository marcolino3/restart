"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Sparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getStudentTimelineAction,
  type StudentTimeline,
  type TimelineGranularity,
} from "../actions/get-student-timeline.action";

type RangeKey = "30D" | "3M" | "SY";

const RANGE_GRANULARITY: Record<RangeKey, TimelineGranularity> = {
  "30D": "DAY",
  "3M": "WEEK",
  SY: "WEEK",
};

const STATUS_COLOR = {
  introduced: "#0ea5e9", // sky-500 — primary indicator
  practiced: "#f59e0b", // amber-500
  mastered: "#10b981", // emerald-500
  needsMore: "#f43f5e", // rose-500
} as const;

const STATUS_KEYS = [
  "needsMore",
  "introduced",
  "practiced",
  "mastered",
] as const;
type StatusKey = (typeof STATUS_KEYS)[number];

interface Props {
  studentId: string;
  /** Warn-Schwelle in Tagen seit letzter INTRODUCED-Aufzeichnung. */
  introWarnDays?: number;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeRange(key: RangeKey): { from: string; to: string } {
  const today = new Date();
  const to = isoDate(today);
  const from = new Date(today);
  if (key === "30D") from.setDate(from.getDate() - 30);
  else if (key === "3M") from.setMonth(from.getMonth() - 3);
  else if (key === "SY") {
    // Schweizer Schuljahr beginnt im August.
    const year =
      today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
    from.setFullYear(year, 7, 1);
  }
  return { from: isoDate(from), to };
}

export function StudentIntroductionTimelineChart({
  studentId,
  introWarnDays = 14,
}: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [range, setRange] = useState<RangeKey>("3M");
  const [data, setData] = useState<StudentTimeline | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { from, to } = useMemo(() => computeRange(range), [range]);
  const granularity = RANGE_GRANULARITY[range];

  useEffect(() => {
    setError(null);
    startTransition(async () => {
      const res = await getStudentTimelineAction(
        studentId,
        from,
        to,
        granularity,
      );
      if (res.success) setData(res.data);
      else {
        setError(res.error ?? "Failed to load timeline");
        setData(null);
      }
    });
  }, [studentId, from, to, granularity]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.buckets.map((b) => ({
      bucketStart: b.bucketStart,
      label: formatBucketLabel(b.bucketStart, granularity, locale),
      introduced: b.introduced,
      practiced: b.practiced,
      mastered: b.mastered,
      needsMore: b.needsMore,
    }));
  }, [data, granularity, locale]);

  const showWarning =
    data?.daysSinceLastIntroduction !== null &&
    data?.daysSinceLastIntroduction !== undefined &&
    data.daysSinceLastIntroduction >= introWarnDays;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            {t("timelineStudentTitle")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("timelineStudentSubtitle")}
          </p>
        </div>
        <ToggleGroup
          type="single"
          size="sm"
          value={range}
          onValueChange={(v) => v && setRange(v as RangeKey)}
          className="self-start sm:self-auto"
        >
          <ToggleGroupItem value="30D">{t("range30Days")}</ToggleGroupItem>
          <ToggleGroupItem value="3M">{t("range3Months")}</ToggleGroupItem>
          <ToggleGroupItem value="SY">{t("rangeSchoolYear")}</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Impact-Header */}
        <div className="flex flex-wrap items-center gap-2">
          {data && (
            <Badge variant="secondary" className="text-[11px]">
              {t("timelineIntroductionsInRange", {
                count: data.totalIntroductionsInRange,
              })}
            </Badge>
          )}
          {data?.daysSinceLastIntroduction !== null &&
            data?.daysSinceLastIntroduction !== undefined && (
              <Badge
                variant={showWarning ? "destructive" : "outline"}
                className="text-[11px]"
              >
                {showWarning && <AlertTriangle className="mr-1 h-3 w-3" />}
                {t("timelineDaysSinceLastIntro", {
                  days: data.daysSinceLastIntroduction,
                })}
              </Badge>
            )}
        </div>

        {error && (
          <p className="text-sm text-destructive italic">{t("loadError")}</p>
        )}
        {pending && !data ? (
          <Skeleton className="h-[260px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("timelineEmpty")}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 12, bottom: 0, left: -20 }}
            >
              <defs>
                {STATUS_KEYS.map((k) => (
                  <linearGradient
                    key={k}
                    id={`grad-${k}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={STATUS_COLOR[k]}
                      stopOpacity={0.55}
                    />
                    <stop
                      offset="100%"
                      stopColor={STATUS_COLOR[k]}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis
                dataKey="label"
                fontSize={11}
                tickMargin={6}
                stroke="currentColor"
                opacity={0.6}
              />
              <YAxis
                allowDecimals={false}
                fontSize={11}
                stroke="currentColor"
                opacity={0.6}
              />
              <Tooltip
                formatter={
                  ((value: number, name: string) => [
                    value,
                    statusLabel(name as StatusKey, t),
                  ]) as unknown as never
                }
                labelClassName="text-xs"
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                }}
              />
              <Legend
                formatter={
                  ((value: string) =>
                    statusLabel(value as StatusKey, t)) as unknown as never
                }
                wrapperStyle={{ fontSize: 11 }}
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="needsMore"
                stroke={STATUS_COLOR.needsMore}
                fill="url(#grad-needsMore)"
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="introduced"
                stroke={STATUS_COLOR.introduced}
                fill="url(#grad-introduced)"
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="practiced"
                stroke={STATUS_COLOR.practiced}
                fill="url(#grad-practiced)"
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="mastered"
                stroke={STATUS_COLOR.mastered}
                fill="url(#grad-mastered)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function statusLabel(
  key: StatusKey,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (key) {
    case "needsMore":
      return t("NEEDS_MORE");
    case "introduced":
      return t("INTRODUCED");
    case "practiced":
      return t("PRACTICED");
    case "mastered":
      return t("MASTERED");
  }
}

function formatBucketLabel(
  iso: string,
  granularity: TimelineGranularity,
  locale: string,
): string {
  const d = new Date(iso);
  if (granularity === "DAY") {
    return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  }
  if (granularity === "MONTH") {
    return d.toLocaleDateString(locale, { month: "short", year: "2-digit" });
  }
  // WEEK
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
}
