"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import type { AreaOption } from "../actions/get-org-areas.action";
import type { AreaLessonCount } from "../actions/get-area-lesson-counts.action";
import type { LessonRecordStatus } from "../types";
import {
  WINDOW_KEYS,
  filterRecordsByWindow,
  type WindowKey,
} from "../lib/filter-records-by-window";

interface Props {
  records: StudentLessonRecordItem[];
  /** All curriculum AREAs in the org. Used as the full axis set —
   *  areas with no records still appear with 0%. */
  allAreas?: AreaOption[];
  /** Total LESSON count per AREA (curriculum-wide). Includes curriculum
   *  info so duplicate-named AREAs can be disambiguated with a suffix. */
  areaLessonCounts?: AreaLessonCount[];
}

type StatusLayer = "INTRODUCED" | "PRACTICED" | "MASTERED" | "NEEDS_MORE";
type DenomMode = "distribution" | "inPeriod" | "curriculum";

// Cumulative layers in render order — INTRODUCED first (outermost ring),
// MASTERED last (innermost, on top). NEEDS_MORE is an orthogonal warning
// overlay, rendered as a dashed outline.
const PROGRESSION_LAYERS: Exclude<StatusLayer, "NEEDS_MORE">[] = [
  "INTRODUCED",
  "PRACTICED",
  "MASTERED",
];
const ALL_LAYERS: StatusLayer[] = [...PROGRESSION_LAYERS, "NEEDS_MORE"];

// Same Tailwind palette as the heatmap (`statusBadgeClass`) so charts and
// table cells stay visually consistent.
const STATUS_COLOR: Record<StatusLayer, string> = {
  MASTERED: "#10b981",   // emerald-500
  PRACTICED: "#f59e0b",  // amber-500
  INTRODUCED: "#0ea5e9", // sky-500
  NEEDS_MORE: "#f43f5e", // rose-500
};

type AreaRow = {
  /** Bucket key (lower-cased trimmed name). Distinguishes axes
   *  internally — not shown to the user. */
  areaId: string;
  area: string;
  /** Curriculum position of the earliest source AREA — drives axis order. */
  position: number;
  /** Denominator total — meaning depends on `denomMode`. */
  total: number;
  /** Raw count per status (for the tooltip). */
  countsByStatus: Record<StatusLayer, number>;
  // Cumulative: each value is the share of the denominator currently at
  // this level or higher (MASTERED ⊆ PRACTICED ⊆ INTRODUCED).
  INTRODUCED: number;
  PRACTICED: number;
  MASTERED: number;
  /** Independent flag layer — share currently at NEEDS_MORE. */
  NEEDS_MORE: number;
};

const POS_INF = Number.MAX_SAFE_INTEGER;

const pickName = (
  translations: { locale: string; name: string }[],
  locale: string,
): string => {
  const normalized = locale.toUpperCase();
  return (
    translations.find((t) => t.locale === normalized)?.name ??
    translations[0]?.name ??
    "—"
  );
};

export function StudentAreaRadar({
  records,
  allAreas = [],
  areaLessonCounts = [],
}: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();

  const [windowKey, setWindowKey] = useState<WindowKey>("last6m");
  const [denomMode, setDenomMode] = useState<DenomMode>("distribution");
  const [visible, setVisible] = useState<Set<StatusLayer>>(
    () => new Set(ALL_LAYERS),
  );

  // Lookup: areaId → curriculum-total lessons + curriculum metadata.
  const countsByArea = useMemo(() => {
    const m = new Map<
      string,
      { lessonCount: number; curriculumId: string | null; curriculumName: string | null }
    >();
    for (const a of areaLessonCounts) {
      m.set(a.areaId, {
        lessonCount: a.lessonCount,
        curriculumId: a.curriculumId ?? null,
        curriculumName: a.curriculumName ?? null,
      });
    }
    return m;
  }, [areaLessonCounts]);

  // Window-filter the records once.
  const scopedRecords = useMemo(
    () => filterRecordsByWindow(records, windowKey).filtered,
    [records, windowKey],
  );

  const data = useMemo<AreaRow[]>(() => {
    // 1. Latest record per lesson within the active window.
    const latest = new Map<
      string,
      {
        status: LessonRecordStatus;
        recordedAt: string;
        id: string;
        areaId: string | null;
      }
    >();
    for (const r of scopedRecords) {
      const area = r.lesson?.ancestors?.find((a) => a.nodeType === "AREA");
      const existing = latest.get(r.lessonId);
      if (
        !existing ||
        r.recordedAt > existing.recordedAt ||
        (r.recordedAt === existing.recordedAt && r.id > existing.id)
      ) {
        latest.set(r.lessonId, {
          status: r.status,
          recordedAt: r.recordedAt,
          id: r.id,
          areaId: area?.id ?? null,
        });
      }
    }

    // 2. Per-area count per status from the (window-scoped) latest map.
    type Agg = {
      total: number;
      MASTERED: number;
      PRACTICED: number;
      INTRODUCED: number;
      NEEDS_MORE: number;
    };
    const byArea = new Map<string, Agg>();
    for (const v of latest.values()) {
      if (!v.areaId) continue;
      if (!byArea.has(v.areaId)) {
        byArea.set(v.areaId, {
          total: 0,
          MASTERED: 0,
          PRACTICED: 0,
          INTRODUCED: 0,
          NEEDS_MORE: 0,
        });
      }
      const e = byArea.get(v.areaId)!;
      e.total += 1;
      if (v.status === "MASTERED") e.MASTERED += 1;
      else if (v.status === "PRACTICED") e.PRACTICED += 1;
      else if (v.status === "INTRODUCED") e.INTRODUCED += 1;
      else if (v.status === "NEEDS_MORE") e.NEEDS_MORE += 1;
      // PLANNING intentionally not shown.
    }

    // 3. Build axis buckets — merge AREAs by their translated NAME so
    //    that gleichnamige Areas aus verschiedenen Lehrplänen (z.B.
    //    „Mathematik" 3×) zu EINER Achse fusionieren. Sonst hätte das
    //    Polygon unsichtbare Duplikat-Achsen, die immer auf 0 fallen und
    //    optisch "Spikes nach innen" erzeugen.
    type AxisBucket = {
      key: string;
      name: string;
      areaIds: string[];
      /** Earliest curriculum position across merged source areas — used
       *  for stable sorting in curriculum order. */
      position: number;
    };
    const bucketsByKey = new Map<string, AxisBucket>();
    const seedAreas =
      allAreas.length > 0
        ? allAreas.map((a) => ({
            id: a.id,
            name: pickName(a.translations, locale),
            position: a.position,
          }))
        : Array.from(byArea.keys()).map((id) => ({
            id,
            name: id,
            position: POS_INF,
          }));
    for (const a of seedAreas) {
      const key = a.name.toLocaleLowerCase().trim();
      const existing = bucketsByKey.get(key);
      if (!existing) {
        bucketsByKey.set(key, {
          key,
          name: a.name,
          areaIds: [a.id],
          position: a.position ?? POS_INF,
        });
      } else {
        existing.areaIds.push(a.id);
        if ((a.position ?? POS_INF) < existing.position) {
          existing.position = a.position ?? POS_INF;
        }
      }
    }

    const axisBuckets = Array.from(bucketsByKey.values());

    // Materialise per-bucket aggregates ONCE so the `distribution` mode
    // can compute its global maximum across all axes in a second pass.
    type Aggregated = {
      bucket: AxisBucket;
      mastered: number;
      practiced: number;
      introduced: number;
      needsMore: number;
      trackedInPeriod: number;
      curriculumLessons: number;
    };
    const aggregated: Aggregated[] = axisBuckets.map((bucket) => {
      let mastered = 0;
      let practiced = 0;
      let introduced = 0;
      let needsMore = 0;
      let trackedInPeriod = 0;
      let curriculumLessons = 0;
      for (const id of bucket.areaIds) {
        const agg = byArea.get(id);
        if (agg) {
          mastered += agg.MASTERED;
          practiced += agg.PRACTICED;
          introduced += agg.INTRODUCED;
          needsMore += agg.NEEDS_MORE;
          trackedInPeriod += agg.total;
        }
        curriculumLessons += countsByArea.get(id)?.lessonCount ?? 0;
      }
      return {
        bucket,
        mastered,
        practiced,
        introduced,
        needsMore,
        trackedInPeriod,
        curriculumLessons,
      };
    });

    // `distribution` mode: every axis is normalised against the BUSIEST
    // bucket's tracked-in-period count. Outer ring (INTRODUCED) shows
    // "how much of the work happened here" → useful for spotting
    // imbalance across subjects.
    const maxTracked = aggregated.reduce(
      (m, a) => (a.trackedInPeriod > m ? a.trackedInPeriod : m),
      0,
    );

    return aggregated
      .map((a) => {
        let denominator: number;
        if (denomMode === "curriculum") denominator = a.curriculumLessons;
        else if (denomMode === "inPeriod") denominator = a.trackedInPeriod;
        else denominator = maxTracked; // distribution

        const pct = (n: number) =>
          denominator > 0 ? Math.round((n / denominator) * 100) : 0;

        const practicedOrMore = a.mastered + a.practiced;
        const introducedOrMore =
          a.mastered + a.practiced + a.introduced;

        return {
          areaId: a.bucket.key,
          area: a.bucket.name,
          position: a.bucket.position,
          // Tooltip-Nenner: in `distribution` zeigen wir den globalen Max,
          // damit der User die Vergleichsbasis sieht.
          total: denominator,
          countsByStatus: {
            MASTERED: a.mastered,
            PRACTICED: a.practiced,
            INTRODUCED: a.introduced,
            NEEDS_MORE: a.needsMore,
          },
          MASTERED: pct(a.mastered),
          PRACTICED: pct(practicedOrMore),
          INTRODUCED: pct(introducedOrMore),
          NEEDS_MORE: pct(a.needsMore),
        };
      })
      // Sort by curriculum-defined `position` first (so order matches the
      // Lehrplan), fall back to alphabet for ties / missing positions.
      .sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return a.area.localeCompare(b.area);
      });
  }, [scopedRecords, allAreas, locale, countsByArea, denomMode]);

  // Caption summary: "N Lektionen in M Bereichen"
  const summary = useMemo(() => {
    const seenLessons = new Set<string>();
    const seenAreas = new Set<string>();
    for (const r of scopedRecords) {
      seenLessons.add(r.lessonId);
      const a = r.lesson?.ancestors?.find((x) => x.nodeType === "AREA")?.id;
      if (a) seenAreas.add(a);
    }
    return { lessons: seenLessons.size, areas: seenAreas.size };
  }, [scopedRecords]);

  const toggle = (s: StatusLayer) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-base">{t("radarTitle")}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {denomMode === "distribution"
              ? t("radarSubtitleDistribution")
              : denomMode === "inPeriod"
                ? t("radarSubtitleInPeriod")
                : t("radarSubtitleCurriculum")}
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic mt-0.5">
            {t("radarCaption", {
              lessons: summary.lessons,
              areas: summary.areas,
            })}
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          {/* Window chips */}
          <div className="flex flex-wrap gap-1" role="group" aria-label={t("windowGroupLabel")}>
            {WINDOW_KEYS.map((w) => {
              const active = windowKey === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWindowKey(w)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  {t(`window_${w}`)}
                </button>
              );
            })}
          </div>
          {/* Denominator toggle */}
          <div
            className="inline-flex rounded-md border p-0.5"
            role="group"
            aria-label={t("denomGroupLabel")}
          >
            {(["distribution", "inPeriod", "curriculum"] as DenomMode[]).map(
              (m) => {
                const active = denomMode === m;
                const labelKey =
                  m === "distribution"
                    ? "denomDistribution"
                    : m === "inPeriod"
                      ? "denomInPeriod"
                      : "denomCurriculum";
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDenomMode(m)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-sm px-2 py-1 text-[11px] transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    {t(labelKey)}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length < 3 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("radarNotEnoughData")}
          </p>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="w-full md:flex-1 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={data}
                  outerRadius="78%"
                  margin={{ top: 16, right: 24, bottom: 16, left: 24 }}
                >
                  <PolarGrid
                    gridType="polygon"
                    stroke="var(--border)"
                    strokeOpacity={0.6}
                  />
                  <PolarAngleAxis
                    dataKey="area"
                    tick={{
                      fill: "var(--foreground)",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                    tickLine={false}
                  />
                  {/* Radius axis is silent — grid lines are enough. */}
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />

                  {/* Progression layers — INTRODUCED first (outer ring),
                       MASTERED last (innermost, on top). Cumulative nesting
                       means they OVERLAP cleanly rather than fight pixels. */}
                  {PROGRESSION_LAYERS.map((s) =>
                    visible.has(s) ? (
                      <Radar
                        key={s}
                        name={t(s)}
                        dataKey={s}
                        stroke={STATUS_COLOR[s]}
                        fill={STATUS_COLOR[s]}
                        fillOpacity={0.32}
                        strokeWidth={2}
                        strokeLinejoin="round"
                        isAnimationActive={false}
                      />
                    ) : null,
                  )}
                  {visible.has("NEEDS_MORE") && (
                    <Radar
                      name={t("NEEDS_MORE")}
                      dataKey="NEEDS_MORE"
                      stroke={STATUS_COLOR.NEEDS_MORE}
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      isAnimationActive={false}
                    />
                  )}
                  <RechartsTooltip
                    formatter={(value, name, item) => {
                      const p = (item as { payload?: AreaRow })?.payload;
                      const v = `${value}%`;
                      if (!p) return [v, name];
                      const layer = (item as { dataKey?: StatusLayer })
                        ?.dataKey;
                      if (!layer) return [v, name];
                      let count = 0;
                      if (layer === "MASTERED") {
                        count = p.countsByStatus.MASTERED;
                      } else if (layer === "PRACTICED") {
                        count =
                          p.countsByStatus.MASTERED +
                          p.countsByStatus.PRACTICED;
                      } else if (layer === "INTRODUCED") {
                        count =
                          p.countsByStatus.MASTERED +
                          p.countsByStatus.PRACTICED +
                          p.countsByStatus.INTRODUCED;
                      } else if (layer === "NEEDS_MORE") {
                        count = p.countsByStatus.NEEDS_MORE;
                      }
                      return [`${count}/${p.total} (${v})`, name];
                    }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Toggleable legend */}
            <ul
              className="flex flex-row flex-wrap gap-2 md:flex-col md:w-44"
              role="group"
              aria-label={t("radarTitle")}
            >
              {ALL_LAYERS.map((s) => {
                const active = visible.has(s);
                const isWarning = s === "NEEDS_MORE";
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => toggle(s)}
                      aria-pressed={active}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors",
                        "hover:bg-muted/60",
                        active
                          ? "border-foreground/20 text-foreground"
                          : "border-transparent text-muted-foreground line-through",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-2.5 w-2.5",
                          isWarning ? "rounded-none" : "rounded-full",
                        )}
                        style={{
                          background: isWarning
                            ? "transparent"
                            : STATUS_COLOR[s],
                          border: isWarning
                            ? `2px dashed ${STATUS_COLOR[s]}`
                            : undefined,
                          opacity: active ? 1 : 0.3,
                        }}
                      />
                      <span className="truncate">{t(s)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
