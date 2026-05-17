"use client";

import { useMemo } from "react";
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

import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import type { AreaOption } from "../actions/get-org-areas.action";
import type { LessonRecordStatus } from "../types";

interface Props {
  records: StudentLessonRecordItem[];
  /** All curriculum AREAs in the org. Used as the full axis set —
   *  areas with no records still appear with 0%. */
  allAreas?: AreaOption[];
}

type AreaRow = {
  areaId: string;
  area: string;
  /** Mastered ratio in 0-100 */
  mastery: number;
  mastered: number;
  total: number;
};

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

/**
 * Picks the latest record per lesson, groups by AREA, and shows the
 * MASTERED ratio per area on a radar/spider chart.
 *
 * Areas without any tracked lesson are omitted.
 */
export function StudentAreaRadar({ records, allAreas = [] }: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();

  const data = useMemo<AreaRow[]>(() => {
    // 1. Latest record per lesson — collect areaId for each
    const latest = new Map<
      string,
      {
        status: LessonRecordStatus;
        recordedAt: string;
        id: string;
        areaId: string | null;
      }
    >();
    for (const r of records) {
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

    // 2. Aggregate per area from the records
    const byArea = new Map<string, { total: number; mastered: number }>();
    for (const v of latest.values()) {
      if (!v.areaId) continue;
      if (!byArea.has(v.areaId)) {
        byArea.set(v.areaId, { total: 0, mastered: 0 });
      }
      const e = byArea.get(v.areaId)!;
      e.total += 1;
      if (v.status === "MASTERED") e.mastered += 1;
    }

    // 3. Axis set = ALL curriculum areas (so untouched areas show 0%)
    //    Falls allAreas leer ist (Backend-Lade-Error), Fallback auf
    //    abgeleitete Areas aus den Records.
    const axisAreas =
      allAreas.length > 0
        ? allAreas.map((a) => ({
            id: a.id,
            name: pickName(a.translations, locale),
            position: a.position,
          }))
        : Array.from(byArea.keys()).map((id) => ({
            id,
            name: id,
            position: 0,
          }));

    return axisAreas
      .map((a) => {
        const agg = byArea.get(a.id) ?? { total: 0, mastered: 0 };
        return {
          areaId: a.id,
          area: a.name,
          mastery:
            agg.total > 0 ? Math.round((agg.mastered / agg.total) * 100) : 0,
          mastered: agg.mastered,
          total: agg.total,
        };
      })
      .sort((a, b) => a.area.localeCompare(b.area));
  }, [records, allAreas, locale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("radarTitle")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("radarSubtitle")}</p>
      </CardHeader>
      <CardContent>
        {data.length < 3 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("radarNotEnoughData")}
          </p>
        ) : (
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="area"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tickCount={5}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  stroke="hsl(var(--border))"
                />
                <Radar
                  name={t("MASTERED")}
                  dataKey="mastery"
                  stroke="hsl(142 71% 45%)"
                  fill="hsl(142 71% 45%)"
                  fillOpacity={0.3}
                />
                <RechartsTooltip
                  // Recharts 3's signature: (value, name, item, index, payload)
                  formatter={(value, _name, item) => {
                    const p = (item as { payload?: AreaRow })?.payload;
                    if (!p) return [`${value}%`, t("MASTERED")];
                    return [`${p.mastered}/${p.total} (${value}%)`, p.area];
                  }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
