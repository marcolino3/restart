"use client";

import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { HeatmapData } from "../actions/get-classroom-heatmap.action";
import { LESSON_RECORD_STATUSES, type LessonRecordStatus } from "../types";

interface Props {
  data: HeatmapData;
}

const STATUS_CLS: Record<LessonRecordStatus, string> = {
  PLANNING: "bg-slate-100 text-slate-700",
  INTRODUCED: "bg-sky-100 text-sky-800",
  PRACTICED: "bg-amber-100 text-amber-800",
  MASTERED: "bg-emerald-100 text-emerald-800",
  NEEDS_MORE: "bg-rose-100 text-rose-800",
};

/**
 * Hintergrund einer Zelle basierend auf MASTERED-Anteil:
 *   0%   = neutral grau
 *   1-33% = sanftes Sky/Amber
 *   34-66% = mittleres Amber
 *   67-99% = sanftes Emerald
 *   100% = sattes Emerald
 */
const cellBgClass = (masteredRatio: number, total: number): string => {
  if (total === 0) return "bg-muted/30";
  if (masteredRatio === 0) return "bg-slate-100";
  if (masteredRatio < 0.34) return "bg-sky-100";
  if (masteredRatio < 0.67) return "bg-amber-100";
  if (masteredRatio < 1) return "bg-emerald-100";
  return "bg-emerald-300";
};

function ClassroomHeatmapImpl({ data }: Props) {
  const t = useTranslations("RecordKeeping");
  const [activeCell, setActiveCell] = useState<{
    studentId: string;
    areaId: string;
  } | null>(null);

  // Aggregierte Zeilen-Statistik (für die Summary-Spalte rechts)
  const studentTotals = useMemo(() => {
    const map: Record<string, { total: number; mastered: number }> = {};
    for (const s of data.students) {
      map[s.studentId] = { total: 0, mastered: 0 };
      for (const a of data.areas) {
        const cell = data.cells[s.studentId]?.[a.areaId];
        if (!cell) continue;
        map[s.studentId].total += cell.total;
        map[s.studentId].mastered += cell.byStatus.MASTERED;
      }
    }
    return map;
  }, [data]);

  // Aggregierte Spalten-Statistik (für die Summary-Zeile unten)
  const areaTotals = useMemo(() => {
    const map: Record<string, { total: number; mastered: number }> = {};
    for (const a of data.areas) {
      map[a.areaId] = { total: 0, mastered: 0 };
      for (const s of data.students) {
        const cell = data.cells[s.studentId]?.[a.areaId];
        if (!cell) continue;
        map[a.areaId].total += cell.total;
        map[a.areaId].mastered += cell.byStatus.MASTERED;
      }
    }
    return map;
  }, [data]);

  if (data.students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {t("noStudentsInClassroom")}
      </p>
    );
  }

  if (data.areas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {t("noLessonsFound")}
      </p>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="overflow-auto rounded-md border bg-card">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/40">
              <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-medium border-b">
                {t("students")}
              </th>
              {data.areas.map((a) => (
                <th
                  key={a.areaId}
                  className="px-2 py-2 text-left font-medium border-b border-l whitespace-nowrap min-w-[110px]"
                >
                  {a.areaName}
                </th>
              ))}
              <th className="px-2 py-2 text-left font-medium border-b border-l whitespace-nowrap bg-muted/60">
                Σ
              </th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s) => {
              const rowTotal = studentTotals[s.studentId];
              const rowMasterRatio =
                rowTotal.total > 0 ? rowTotal.mastered / rowTotal.total : 0;
              return (
                <tr key={s.studentId} className="border-b last:border-0">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium whitespace-nowrap border-r">
                    {s.firstName} {s.lastName}
                  </td>
                  {data.areas.map((a) => {
                    const cell = data.cells[s.studentId]?.[a.areaId];
                    const total = cell?.total ?? 0;
                    const mastered = cell?.byStatus.MASTERED ?? 0;
                    const ratio = total > 0 ? mastered / total : 0;
                    const active =
                      activeCell?.studentId === s.studentId &&
                      activeCell?.areaId === a.areaId;
                    return (
                      <Tooltip key={a.areaId}>
                        <TooltipTrigger asChild>
                          <td
                            onMouseEnter={() =>
                              setActiveCell({
                                studentId: s.studentId,
                                areaId: a.areaId,
                              })
                            }
                            onMouseLeave={() => setActiveCell(null)}
                            className={cn(
                              "px-2 py-2 text-center border-l cursor-default tabular-nums transition-colors",
                              cellBgClass(ratio, total),
                              active && "ring-2 ring-inset ring-primary/60",
                            )}
                          >
                            {total === 0 ? (
                              <span className="text-muted-foreground/40">
                                —
                              </span>
                            ) : (
                              <span className="font-medium">
                                {mastered}/{total}
                              </span>
                            )}
                          </td>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs space-y-1"
                        >
                          <div className="font-medium">
                            {s.firstName} {s.lastName} · {a.areaName}
                          </div>
                          {total === 0 ? (
                            <div className="text-muted-foreground">
                              {t("noLessonsFound")}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {LESSON_RECORD_STATUSES.map((status) => {
                                const c = cell?.byStatus[status] ?? 0;
                                if (c === 0) return null;
                                return (
                                  <div
                                    key={status}
                                    className="flex items-center justify-between gap-3"
                                  >
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${STATUS_CLS[status]}`}
                                    >
                                      {t(status)}
                                    </Badge>
                                    <span className="tabular-nums">{c}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  <td
                    className={cn(
                      "px-2 py-2 text-center border-l tabular-nums font-medium",
                      cellBgClass(rowMasterRatio, rowTotal.total),
                    )}
                  >
                    {rowTotal.total > 0
                      ? `${rowTotal.mastered}/${rowTotal.total}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/40 border-t-2">
              <td className="sticky left-0 z-10 bg-muted/40 px-3 py-2 font-medium">
                Σ
              </td>
              {data.areas.map((a) => {
                const at = areaTotals[a.areaId];
                const r = at.total > 0 ? at.mastered / at.total : 0;
                return (
                  <td
                    key={a.areaId}
                    className={cn(
                      "px-2 py-2 text-center border-l tabular-nums font-medium",
                      cellBgClass(r, at.total),
                    )}
                  >
                    {at.total > 0 ? `${at.mastered}/${at.total}` : "—"}
                  </td>
                );
              })}
              <td className="px-2 py-2 text-center border-l bg-muted/60">—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legende */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{t("MASTERED")}-Anteil:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded border bg-slate-100" />
          0%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded border bg-sky-100" />
          1-33%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded border bg-amber-100" />
          34-66%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded border bg-emerald-100" />
          67-99%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded border bg-emerald-300" />
          100%
        </span>
      </div>
    </TooltipProvider>
  );
}

/** Memoized: tab-switches in ClassroomTabs don't re-render the grid. */
export const ClassroomHeatmap = memo(ClassroomHeatmapImpl);
