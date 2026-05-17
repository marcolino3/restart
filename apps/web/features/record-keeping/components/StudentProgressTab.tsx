"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Sparkles, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import type { LessonOption, LessonRecordStatus } from "../types";

interface Props {
  records: StudentLessonRecordItem[];
  nextLessons: LessonOption[];
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

export function StudentProgressTab({ records, nextLessons }: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();

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

  // Zähler pro Status (für die Übersichtskarten oben)
  const statusCounts = useMemo(() => {
    const counts: Record<LessonRecordStatus, number> = {
      PLANNING: 0,
      INTRODUCED: 0,
      PRACTICED: 0,
      MASTERED: 0,
      NEEDS_MORE: 0,
    };
    for (const r of currentByLesson.values()) {
      counts[r.status] += 1;
    }
    return counts;
  }, [currentByLesson]);

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

  return (
    <div className="flex flex-col gap-6">
      {/* Status-Summary */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {(
          [
            "PLANNING",
            "INTRODUCED",
            "PRACTICED",
            "MASTERED",
            "NEEDS_MORE",
          ] as LessonRecordStatus[]
        ).map((s) => (
          <Card key={s}>
            <CardContent className="flex flex-col items-start gap-1 p-3">
              <Badge
                variant="outline"
                className={`text-[10px] uppercase ${STATUS_CLS[s]}`}
              >
                {t(s)}
              </Badge>
              <span className="text-2xl font-semibold tabular-nums">
                {statusCounts[s]}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              {t("nextLessons") /* re-use as section title fallback */
                ? null
                : null}
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
    </div>
  );
}
