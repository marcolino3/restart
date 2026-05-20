"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquareText, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import { deriveNoteTimeline } from "../lib/derive-observation-metrics";
import type { LessonRecordStatus } from "../types";

interface Props {
  records: StudentLessonRecordItem[];
}

const STATUS_CLS: Record<LessonRecordStatus, string> = {
  PLANNING: "bg-slate-100 text-slate-700 border-slate-300",
  INTRODUCED: "bg-sky-100 text-sky-800 border-sky-300",
  PRACTICED: "bg-amber-100 text-amber-800 border-amber-300",
  MASTERED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  NEEDS_MORE: "bg-rose-100 text-rose-800 border-rose-300",
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("de-CH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

export function ChildObservationNotesTimeline({ records }: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [query, setQuery] = useState("");

  const items = useMemo(
    () => deriveNoteTimeline(records, locale),
    [records, locale],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.note.toLowerCase().includes(q) ||
        (i.lessonName ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareText className="h-4 w-4" />
          {t("notesTimelineTitle")}
          <Badge
            variant="secondary"
            className="ml-auto text-[10px] tabular-nums"
          >
            {items.length}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("notesTimelineHint")}</p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("notesTimelineEmpty")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("notesTimelineSearchPlaceholder")}
                className="pl-7 h-8 text-xs"
              />
            </div>
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {t("notesTimelineNoMatches")}
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {filtered.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1.5 rounded-md border bg-card px-3 py-2"
                  >
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDate(item.recordedAt)}
                      </span>
                      <span className="text-sm font-medium flex-1 min-w-0 truncate">
                        {item.lessonName ?? "—"}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase whitespace-nowrap ${STATUS_CLS[item.status]}`}
                      >
                        {t(item.status)}
                      </Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {item.note}
                    </p>
                    {item.recordedBy && (
                      <p className="text-[10px] text-muted-foreground">
                        {item.recordedBy.firstName} {item.recordedBy.lastName}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
