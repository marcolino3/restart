"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  Compass,
  Heart,
  Info,
  Target,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import {
  OBSERVATION_METRICS_THRESHOLDS,
  deriveConcentrationMix,
  deriveConfidenceTrend,
  deriveEngagementTrend,
  derivePersistenceOverTime,
  deriveSelfAssessmentCalibration,
  deriveVisibleLearnerRadar,
  deriveZpdGauge,
} from "../lib/derive-observation-metrics";

interface Props {
  records: StudentLessonRecordItem[];
}

type TimeRange = "all" | "90d" | "30d" | "7d";

const filterRecordsByRange = (
  records: StudentLessonRecordItem[],
  range: TimeRange,
): StudentLessonRecordItem[] => {
  if (range === "all") return records;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  return records.filter((r) => r.recordedAt >= cutoffIso);
};

export function LearningStanceTab({ records }: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [timeRange, setTimeRange] = useState<TimeRange>("90d");

  const filteredRecords = useMemo(
    () => filterRecordsByRange(records, timeRange),
    [records, timeRange],
  );

  const confidenceTrend = useMemo(
    () => deriveConfidenceTrend(filteredRecords),
    [filteredRecords],
  );
  const concentrationMix = useMemo(
    () => deriveConcentrationMix(filteredRecords),
    [filteredRecords],
  );
  const persistenceOverTime = useMemo(
    () => derivePersistenceOverTime(filteredRecords),
    [filteredRecords],
  );
  const zpdGauge = useMemo(() => deriveZpdGauge(filteredRecords), [filteredRecords]);
  const engagementTrend = useMemo(
    () => deriveEngagementTrend(filteredRecords),
    [filteredRecords],
  );
  const radar = useMemo(
    () => deriveVisibleLearnerRadar(filteredRecords),
    [filteredRecords],
  );
  const calibration = useMemo(
    () => deriveSelfAssessmentCalibration(filteredRecords),
    [filteredRecords],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Zeitfenster-Selektor */}
      <div className="flex items-center justify-end">
        <Select
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as TimeRange)}
        >
          <SelectTrigger
            className="w-[180px] rounded-lg"
            aria-label={t("learningStanceTimeRangeLabel")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              {t("learningStanceRange7d")}
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              {t("learningStanceRange30d")}
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              {t("learningStanceRange90d")}
            </SelectItem>
            <SelectItem value="all" className="rounded-lg">
              {t("learningStanceRangeAll")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Phase 1 — 5 Karten */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ConfidenceTrendCard trend={confidenceTrend} t={t} locale={locale} />
        <ConcentrationMixCard mix={concentrationMix} t={t} />
        <ZpdGaugeCard gauge={zpdGauge} t={t} />
        <PersistenceOverTimeCard overTime={persistenceOverTime} t={t} />
        <EngagementTrendCard trend={engagementTrend} t={t} locale={locale} />
      </div>

      {/* Phase 3 — Radar + Kalibrierung */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VisibleLearnerRadarCard radar={radar} t={t} />
        <CalibrationCard calibration={calibration} t={t} />
      </div>
    </div>
  );
}

const dateLabel = (iso: string, locale: string): string => {
  if (!iso) return "";
  const intlLocale = locale.startsWith("de") ? "de-CH" : "en-US";
  return new Date(iso + "T00:00:00Z").toLocaleDateString(intlLocale, {
    month: "short",
    day: "numeric",
  });
};

/* ─────────────────────────────────────────────────────────────────────── */
/*  Bausteine                                                              */
/* ─────────────────────────────────────────────────────────────────────── */

type TFn = ReturnType<typeof useTranslations>;

const EmptyHint = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
    <Info className="h-4 w-4 text-muted-foreground" aria-hidden />
    <p className="text-xs text-muted-foreground max-w-[28ch] leading-relaxed">
      {children}
    </p>
  </div>
);

const SectionCard = ({
  title,
  icon,
  children,
  hint,
}: {
  title: React.ReactNode;
  icon: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </CardTitle>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

/* ─────────────────────────────────────────────────────────────────────── */
/*  Karte 1 — Selbstvertrauen-Trend                                        */
/* ─────────────────────────────────────────────────────────────────────── */

const CONFIDENCE_CONFIG: ChartConfig = {
  score: {
    label: "Selbstvertrauen",
    color: "var(--chart-1)",
  },
};

function ConfidenceTrendCard({
  trend,
  t,
  locale,
}: {
  trend: ReturnType<typeof deriveConfidenceTrend>;
  t: TFn;
  locale: string;
}) {
  const direction =
    trend.latest != null && trend.average != null
      ? trend.latest - trend.average
      : 0;
  const config: ChartConfig = {
    ...CONFIDENCE_CONFIG,
    score: { ...CONFIDENCE_CONFIG.score, label: t("learningStanceConfidenceAverage") },
  };
  return (
    <SectionCard
      title={t("learningStanceConfidenceTitle")}
      icon={<Heart className="h-4 w-4" />}
      hint={t("learningStanceConfidenceHint")}
    >
      {!trend.hasData ? (
        <EmptyHint>{t("learningStanceCardNotEnoughData")}</EmptyHint>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums">
              {trend.average != null ? trend.average.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("learningStanceConfidenceAverage")}
            </span>
            <span
              className={cn(
                "ml-auto inline-flex items-center gap-1 text-xs font-medium",
                direction > 0.1
                  ? "text-emerald-600"
                  : direction < -0.1
                    ? "text-rose-600"
                    : "text-muted-foreground",
              )}
            >
              {direction > 0.1 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : direction < -0.1 ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : null}
              {direction > 0
                ? `+${direction.toFixed(1)}`
                : direction.toFixed(1)}
            </span>
          </div>
          <ChartContainer config={config} className="aspect-auto h-[180px] w-full">
            <AreaChart
              data={trend.points}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="recordedAt"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(v: string) => dateLabel(v, locale)}
              />
              <YAxis domain={[-1, 1]} hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(v) => dateLabel(String(v), locale)}
                  />
                }
              />
              <Area
                dataKey="score"
                type="natural"
                fill="url(#fillConfidence)"
                stroke="var(--color-score)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Karte 2 — Konzentrations-Mix                                           */
/* ─────────────────────────────────────────────────────────────────────── */

function ConcentrationMixCard({
  mix,
  t,
}: {
  mix: ReturnType<typeof deriveConcentrationMix>;
  t: TFn;
}) {
  const data = [
    {
      name: t("observationConcentration_FLOW"),
      value: mix.counts.FLOW,
      color: "#10b981",
    },
    {
      name: t("observationConcentration_PARTIAL_FOCUS"),
      value: mix.counts.PARTIAL_FOCUS,
      color: "#f59e0b",
    },
    {
      name: t("observationConcentration_INTERRUPTED"),
      value: mix.counts.INTERRUPTED,
      color: "#f43f5e",
    },
  ];
  return (
    <SectionCard
      title={t("learningStanceConcentrationTitle")}
      icon={<Waves className="h-4 w-4" />}
      hint={t("learningStanceConcentrationHint")}
    >
      {!mix.hasData ? (
        <EmptyHint>{t("learningStanceCardNotEnoughData")}</EmptyHint>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ fontSize: "11px" }}
                  formatter={(value, name) => [String(value), String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums leading-none">
                {mix.flowPercent}%
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                {t("observationConcentration_FLOW")}
              </span>
            </div>
          </div>
          <ul className="flex flex-col gap-1 text-xs">
            {data.map((d) => (
              <li key={d.name} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-foreground">{d.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {d.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Karte 3 — ZPD-Sweet-Spot Gauge                                         */
/* ─────────────────────────────────────────────────────────────────────── */

function ZpdGaugeCard({
  gauge,
  t,
}: {
  gauge: ReturnType<typeof deriveZpdGauge>;
  t: TFn;
}) {
  return (
    <SectionCard
      title={t("learningStanceZpdTitle")}
      icon={<Target className="h-4 w-4" />}
      hint={t("learningStanceZpdHint")}
    >
      {!gauge.hasData ? (
        <EmptyHint>{t("learningStanceCardNotEnoughData")}</EmptyHint>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums">
              {gauge.sweetSpotPercent}%
            </span>
            <span className="text-xs text-muted-foreground">
              {t("learningStanceZpdJustRight", { count: gauge.justRight })}
            </span>
          </div>
          {/* Mini stacked horizontal bar: TOO_EASY / JUST_RIGHT / TOO_HARD */}
          <div className="flex h-3 w-full overflow-hidden rounded-full border bg-card">
            <div
              className="bg-sky-500"
              style={{ width: `${(gauge.tooEasy / gauge.total) * 100}%` }}
              title={t("observationDifficulty_TOO_EASY")}
            />
            <div
              className="bg-emerald-500"
              style={{ width: `${(gauge.justRight / gauge.total) * 100}%` }}
              title={t("observationDifficulty_JUST_RIGHT")}
            />
            <div
              className="bg-rose-500"
              style={{ width: `${(gauge.tooHard / gauge.total) * 100}%` }}
              title={t("observationDifficulty_TOO_HARD")}
            />
          </div>
          <ul className="grid grid-cols-3 gap-1 text-[11px]">
            <li className="flex flex-col items-start">
              <span className="text-muted-foreground">
                {t("observationDifficulty_TOO_EASY")}
              </span>
              <span className="font-medium tabular-nums">{gauge.tooEasy}</span>
            </li>
            <li className="flex flex-col items-start">
              <span className="text-muted-foreground">
                {t("observationDifficulty_JUST_RIGHT")}
              </span>
              <span className="font-medium tabular-nums">
                {gauge.justRight}
              </span>
            </li>
            <li className="flex flex-col items-start">
              <span className="text-muted-foreground">
                {t("observationDifficulty_TOO_HARD")}
              </span>
              <span className="font-medium tabular-nums">{gauge.tooHard}</span>
            </li>
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Karte 4 — Umgang mit Schwierigkeit über Zeit                           */
/* ─────────────────────────────────────────────────────────────────────── */

function PersistenceOverTimeCard({
  overTime,
  t,
}: {
  overTime: ReturnType<typeof derivePersistenceOverTime>;
  t: TFn;
}) {
  const config: ChartConfig = {
    persists: {
      label: t("observationPersistence_PERSISTS"),
      color: "#10b981",
    },
    seeksHelp: {
      label: t("observationPersistence_SEEKS_HELP"),
      color: "#0ea5e9",
    },
    givesUp: {
      label: t("observationPersistence_GIVES_UP"),
      color: "#f43f5e",
    },
  };
  return (
    <SectionCard
      title={t("learningStancePersistenceTitle")}
      icon={<Compass className="h-4 w-4" />}
      hint={t("learningStancePersistenceHint")}
    >
      {!overTime.hasData ? (
        <EmptyHint>{t("learningStanceCardNotEnoughData")}</EmptyHint>
      ) : (
        <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
          <AreaChart
            data={overTime.buckets}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillPersists" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-persists)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-persists)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillSeeksHelp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-seeksHelp)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-seeksHelp)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillGivesUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-givesUp)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-givesUp)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="persists"
              stackId="p"
              type="natural"
              fill="url(#fillPersists)"
              stroke="var(--color-persists)"
            />
            <Area
              dataKey="seeksHelp"
              stackId="p"
              type="natural"
              fill="url(#fillSeeksHelp)"
              stroke="var(--color-seeksHelp)"
            />
            <Area
              dataKey="givesUp"
              stackId="p"
              type="natural"
              fill="url(#fillGivesUp)"
              stroke="var(--color-givesUp)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Karte 5 — Engagement-Score                                             */
/* ─────────────────────────────────────────────────────────────────────── */

function EngagementTrendCard({
  trend,
  t,
  locale,
}: {
  trend: ReturnType<typeof deriveEngagementTrend>;
  t: TFn;
  locale: string;
}) {
  const config: ChartConfig = {
    score: {
      label: t("learningStanceEngagementScale"),
      color: "var(--chart-2)",
    },
  };
  return (
    <SectionCard
      title={t("learningStanceEngagementTitle")}
      icon={<Activity className="h-4 w-4" />}
      hint={t("learningStanceEngagementHint")}
    >
      {!trend.hasData ? (
        <EmptyHint>{t("learningStanceCardNotEnoughData")}</EmptyHint>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums">
              {trend.average != null ? trend.average.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("learningStanceEngagementScale")}
            </span>
          </div>
          <ChartContainer config={config} className="aspect-auto h-[180px] w-full">
            <AreaChart
              data={trend.points}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="recordedAt"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(v: string) => dateLabel(v, locale)}
              />
              <YAxis domain={[0, 3]} hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(v) => dateLabel(String(v), locale)}
                  />
                }
              />
              <Area
                dataKey="score"
                type="natural"
                fill="url(#fillEngagement)"
                stroke="var(--color-score)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Phase 3 — Visible-Learner-Radar                                        */
/* ─────────────────────────────────────────────────────────────────────── */

function VisibleLearnerRadarCard({
  radar,
  t,
}: {
  radar: ReturnType<typeof deriveVisibleLearnerRadar>;
  t: TFn;
}) {
  const data = radar.axes.map((a) => ({
    axis: t(`learningStanceRadar_${a.key}` as const),
    value: a.value,
    sample: a.sample,
  }));

  return (
    <SectionCard
      title={t("learningStanceRadarTitle")}
      icon={<Activity className="h-4 w-4" />}
      hint={t("learningStanceRadarHint")}
    >
      {!radar.hasEnoughData ? (
        <EmptyHint>
          {t("learningStanceRadarNotEnough", {
            have: radar.observationRecords,
            need: OBSERVATION_METRICS_THRESHOLDS.radarMinRecords,
          })}
        </EmptyHint>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 11, fill: "#334155" }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fontSize: 9 }}
                tickCount={5}
              />
              <Radar
                name={t("learningStanceRadarTitle")}
                dataKey="value"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.3}
                isAnimationActive={false}
              />
              <RechartsTooltip
                contentStyle={{ fontSize: "11px" }}
                formatter={(value, _name, item) => {
                  const sample =
                    (item as { payload?: { sample?: number } })?.payload
                      ?.sample ?? 0;
                  return [
                    `${String(value)}% (${sample})`,
                    t("learningStanceRadarTitle"),
                  ];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Phase 3 — Self-Assessment-Kalibrierung                                 */
/* ─────────────────────────────────────────────────────────────────────── */

function CalibrationCard({
  calibration,
  t,
}: {
  calibration: ReturnType<typeof deriveSelfAssessmentCalibration>;
  t: TFn;
}) {
  return (
    <SectionCard
      title={t("learningStanceCalibrationTitle")}
      icon={<AlertCircle className="h-4 w-4" />}
      hint={t("learningStanceCalibrationHint")}
    >
      {!calibration.hasEnoughData ? (
        <EmptyHint>
          {t("learningStanceCalibrationNotEnough", {
            have: calibration.evaluated,
            need: OBSERVATION_METRICS_THRESHOLDS.calibrationMinSelfAssessments,
          })}
        </EmptyHint>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums">
              {calibration.calibrationPercent}%
            </span>
            <span className="text-xs text-muted-foreground">
              {t("learningStanceCalibrationAccurate", {
                count: calibration.calibrated,
                total: calibration.evaluated,
              })}
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-[11px]">
            <Stat
              tone="emerald"
              label={t("learningStanceCalibrationAccurateLabel")}
              value={calibration.calibrated}
            />
            <Stat
              tone="rose"
              label={t("learningStanceCalibrationOverestimated")}
              value={calibration.overestimated}
            />
            <Stat
              tone="sky"
              label={t("learningStanceCalibrationUnderestimated")}
              value={calibration.underestimated}
            />
          </dl>
        </div>
      )}
    </SectionCard>
  );
}

const STAT_TONE = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  rose: "bg-rose-50 border-rose-200 text-rose-900",
  sky: "bg-sky-50 border-sky-200 text-sky-900",
} as const;

const Stat = ({
  tone,
  label,
  value,
}: {
  tone: keyof typeof STAT_TONE;
  label: string;
  value: number;
}) => (
  <div
    className={cn(
      "flex flex-col gap-0.5 rounded-md border px-2 py-1.5",
      STAT_TONE[tone],
    )}
  >
    <span className="text-[10px] uppercase tracking-wide opacity-70">
      {label}
    </span>
    <span className="text-lg font-semibold tabular-nums leading-none">
      {value}
    </span>
  </div>
);
