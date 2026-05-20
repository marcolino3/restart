"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LineChart as LineIcon } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  getClassroomEngagementTimelineAction,
  type EngagementTimeline,
} from "../actions/get-classroom-engagement-timeline.action";
import type { TimelineGranularity } from "../actions/get-student-timeline.action";

type RangeKey = "30D" | "3M" | "SY";
type Mode = "ABSOLUTE" | "PERCENT";

const RANGE_GRANULARITY: Record<RangeKey, TimelineGranularity> = {
  "30D": "DAY",
  "3M": "WEEK",
  SY: "WEEK",
};

const ENGAGEMENT_COLOR = {
  focused: "#059669", // emerald-600
  interested: "#10b981", // emerald-500
  mechanical: "#f59e0b", // amber-500
  resistant: "#f43f5e", // rose-500
} as const;

const ENGAGEMENT_KEYS = [
  "resistant",
  "mechanical",
  "interested",
  "focused",
] as const;
type EngagementKey = (typeof ENGAGEMENT_KEYS)[number];

interface Props {
  schoolClassId: string;
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
    const year =
      today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
    from.setFullYear(year, 7, 1);
  }
  return { from: isoDate(from), to };
}

export function ClassroomEngagementTimelineChart({ schoolClassId }: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [range, setRange] = useState<RangeKey>("3M");
  const [mode, setMode] = useState<Mode>("PERCENT");
  const [data, setData] = useState<EngagementTimeline | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { from, to } = useMemo(() => computeRange(range), [range]);
  const granularity = RANGE_GRANULARITY[range];

  useEffect(() => {
    setError(null);
    startTransition(async () => {
      const res = await getClassroomEngagementTimelineAction(
        schoolClassId,
        from,
        to,
        granularity,
      );
      if (res.success) setData(res.data);
      else {
        setError(res.error ?? "Failed to load engagement timeline");
        setData(null);
      }
    });
  }, [schoolClassId, from, to, granularity]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.buckets.map((b) => {
      const total = b.total || 1; // guard against /0; renders 0 for empty buckets
      const project = (n: number) =>
        mode === "PERCENT" ? Math.round((n / total) * 100) : n;
      return {
        bucketStart: b.bucketStart,
        label: formatBucketLabel(b.bucketStart, granularity, locale),
        focused: project(b.focused),
        interested: project(b.interested),
        mechanical: project(b.mechanical),
        resistant: project(b.resistant),
        rawTotal: b.total,
      };
    });
  }, [data, granularity, locale, mode]);

  const positiveShare = useMemo(() => {
    if (!data || data.totalObserved === 0) return null;
    const positives = data.buckets.reduce(
      (sum, b) => sum + b.focused + b.interested,
      0,
    );
    return Math.round((positives / data.totalObserved) * 100);
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <LineIcon className="h-4 w-4" />
            {t("timelineClassroomTitle")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("timelineClassroomSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            value={mode}
            onValueChange={(v) => v && setMode(v as Mode)}
          >
            <ToggleGroupItem value="PERCENT">
              {t("timelineModePercent")}
            </ToggleGroupItem>
            <ToggleGroupItem value="ABSOLUTE">
              {t("timelineModeAbsolute")}
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            size="sm"
            value={range}
            onValueChange={(v) => v && setRange(v as RangeKey)}
          >
            <ToggleGroupItem value="30D">{t("range30Days")}</ToggleGroupItem>
            <ToggleGroupItem value="3M">{t("range3Months")}</ToggleGroupItem>
            <ToggleGroupItem value="SY">
              {t("rangeSchoolYear")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {data && (
            <Badge variant="secondary" className="text-[11px]">
              {t("timelineObservedTotal", { count: data.totalObserved })}
            </Badge>
          )}
          {positiveShare !== null && (
            <Badge variant="outline" className="text-[11px]">
              {t("timelinePositiveShare", { percent: positiveShare })}
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
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 12, bottom: 0, left: -20 }}
            >
              <defs>
                {ENGAGEMENT_KEYS.map((k) => (
                  <linearGradient
                    key={k}
                    id={`engagement-${k}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={ENGAGEMENT_COLOR[k]}
                      stopOpacity={0.55}
                    />
                    <stop
                      offset="100%"
                      stopColor={ENGAGEMENT_COLOR[k]}
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
                domain={mode === "PERCENT" ? [0, 100] : undefined}
                tickFormatter={(v: number) =>
                  mode === "PERCENT" ? `${v}%` : `${v}`
                }
              />
              <Tooltip
                formatter={
                  ((value: number, name: string) => [
                    mode === "PERCENT" ? `${value}%` : value,
                    engagementLabel(name as EngagementKey, t),
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
                    engagementLabel(value as EngagementKey, t)) as unknown as never
                }
                wrapperStyle={{ fontSize: 11 }}
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="resistant"
                stroke={ENGAGEMENT_COLOR.resistant}
                fill="url(#engagement-resistant)"
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="mechanical"
                stroke={ENGAGEMENT_COLOR.mechanical}
                fill="url(#engagement-mechanical)"
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="interested"
                stroke={ENGAGEMENT_COLOR.interested}
                fill="url(#engagement-interested)"
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="focused"
                stroke={ENGAGEMENT_COLOR.focused}
                fill="url(#engagement-focused)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function engagementLabel(
  key: EngagementKey,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (key) {
    case "focused":
      return t("observationEngagement_FOCUSED");
    case "interested":
      return t("observationEngagement_INTERESTED");
    case "mechanical":
      return t("observationEngagement_MECHANICAL");
    case "resistant":
      return t("observationEngagement_RESISTANT");
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
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
}
