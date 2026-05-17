"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Layers,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import type { AreaOption } from "../actions/get-org-areas.action";
import { StudentAreaRadar } from "./StudentAreaRadar";
import {
  LESSON_RECORD_STATUSES,
  type LessonOption,
  type LessonRecordStatus,
} from "../types";

interface Props {
  records: StudentLessonRecordItem[];
  nextLessons: LessonOption[];
  allAreas?: AreaOption[];
}

const STATUS_CLS: Record<LessonRecordStatus, string> = {
  PLANNING: "bg-slate-100 text-slate-700 border-slate-300",
  INTRODUCED: "bg-sky-100 text-sky-800 border-sky-300",
  PRACTICED: "bg-amber-100 text-amber-800 border-amber-300",
  MASTERED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  NEEDS_MORE: "bg-rose-100 text-rose-800 border-rose-300",
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

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("de-CH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

type AreaGroup = {
  areaId: string;
  areaName: string;
  /** Map lessonId → latest record (the "current status"). */
  lessons: Array<{
    lessonId: string;
    lessonName: string;
    record: StudentLessonRecordItem;
  }>;
};

const UNGROUPED_AREA_ID = "__ungrouped__";

export function StudentProgressTab({
  records,
  nextLessons,
  allAreas = [],
}: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<LessonRecordStatus | null>(
    null,
  );
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());

  // Aktueller Status pro Lektion = neuester Eintrag.
  const currentByLesson = useMemo(() => {
    const map = new Map<string, StudentLessonRecordItem>();
    for (const r of records) {
      const existing = map.get(r.lessonId);
      if (
        !existing ||
        r.recordedAt > existing.recordedAt ||
        (r.recordedAt === existing.recordedAt && r.id > existing.id)
      ) {
        map.set(r.lessonId, r);
      }
    }
    return map;
  }, [records]);

  // Zähler pro Status
  const statusCounts = useMemo(() => {
    const counts: Record<LessonRecordStatus, number> = {
      PLANNING: 0,
      INTRODUCED: 0,
      PRACTICED: 0,
      MASTERED: 0,
      NEEDS_MORE: 0,
    };
    for (const r of currentByLesson.values()) counts[r.status] += 1;
    return counts;
  }, [currentByLesson]);

  // Per-Area-Gruppierung (basierend auf ancestors)
  const areaGroups = useMemo(() => {
    const map = new Map<string, AreaGroup>();
    for (const record of currentByLesson.values()) {
      if (statusFilter && record.status !== statusFilter) continue;
      const lesson = record.lesson;
      const area = lesson?.ancestors?.find((a) => a.nodeType === "AREA");
      const areaId = area?.id ?? UNGROUPED_AREA_ID;
      const areaName = area
        ? pickName(area.translations, locale)
        : t("title");
      const lessonName = lesson
        ? pickName(lesson.translations, locale)
        : record.lessonId;

      if (!map.has(areaId)) {
        map.set(areaId, { areaId, areaName, lessons: [] });
      }
      map.get(areaId)!.lessons.push({
        lessonId: record.lessonId,
        lessonName,
        record,
      });
    }
    // Sortierung Areas alphabetisch, Lessons innerhalb alphabetisch
    const sorted = Array.from(map.values()).sort((a, b) =>
      a.areaName.localeCompare(b.areaName),
    );
    for (const g of sorted) {
      g.lessons.sort((a, b) => a.lessonName.localeCompare(b.lessonName));
    }
    return sorted;
  }, [currentByLesson, statusFilter, locale, t]);

  const recentRecords = useMemo(
    () =>
      [...records]
        .sort((a, b) => {
          if (a.recordedAt !== b.recordedAt)
            return b.recordedAt.localeCompare(a.recordedAt);
          return b.id.localeCompare(a.id);
        })
        .slice(0, 20),
    [records],
  );

  const toggleArea = (id: string) =>
    setCollapsedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Status-Summary mit Filter-Toggle */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {LESSON_RECORD_STATUSES.map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(active ? null : s)}
              className={cn(
                "text-left rounded-lg border bg-card p-3 transition-colors hover:bg-accent",
                active && "ring-2 ring-primary",
              )}
            >
              <Badge
                variant="outline"
                className={`text-[10px] uppercase ${STATUS_CLS[s]}`}
              >
                {t(s)}
              </Badge>
              <div className="text-2xl font-semibold tabular-nums mt-1">
                {statusCounts[s]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Per-Area-Gruppierung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            {t("title")}
            {statusFilter && (
              <Badge
                variant="outline"
                className={`text-[10px] ${STATUS_CLS[statusFilter]}`}
              >
                {t(statusFilter)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {areaGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="flex flex-col gap-3">
              {areaGroups.map((g) => {
                const collapsed = collapsedAreas.has(g.areaId);
                return (
                  <div key={g.areaId} className="rounded-md border">
                    <button
                      type="button"
                      onClick={() => toggleArea(g.areaId)}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent rounded-md"
                    >
                      {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="font-medium text-sm">{g.areaName}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {g.lessons.length}
                      </Badge>
                    </button>
                    {!collapsed && (
                      <ul className="flex flex-col gap-0.5 px-2 pb-2">
                        {g.lessons.map(({ lessonId, lessonName, record }) => (
                          <li
                            key={lessonId}
                            className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent"
                          >
                            <span className="text-sm flex-1 truncate">
                              {lessonName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase ${STATUS_CLS[record.status]}`}
                            >
                              {t(record.status)}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                              {formatDate(record.recordedAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Radar pro Bereich */}
      <StudentAreaRadar records={records} allAreas={allAreas} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              {t("title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {recentRecords.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 rounded-md border bg-card px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {formatDate(r.recordedAt)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {r.lesson
                            ? pickName(r.lesson.translations, locale)
                            : r.lessonId}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase ${STATUS_CLS[r.status]}`}
                        >
                          {t(r.status)}
                        </Badge>
                      </div>
                      {r.note && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {r.note}
                        </p>
                      )}
                      {r.recordedBy && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {r.recordedBy.firstName} {r.recordedBy.lastName}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Next-Lesson-Vorschläge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              {t("nextLessons")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noNextLessons")}
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {nextLessons.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
                  >
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span className="text-sm flex-1 truncate">
                      {pickName(l.translations, locale)}
                    </span>
                    {l.lessonType && (
                      <Badge variant="secondary" className="text-[10px]">
                        {l.lessonType === "THREE_PL" ? "3PL" : l.lessonType}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hint: clear-filter via Status-Pill click */}
      {statusFilter && (
        <div className="flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            ✕ {t("title")} ({t(statusFilter)})
          </Button>
        </div>
      )}
    </div>
  );
}
