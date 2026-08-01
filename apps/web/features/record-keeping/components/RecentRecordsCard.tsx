"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getRecentLessonRecordsAction,
  type RecentLessonRecordItem,
} from "../actions/get-recent-lesson-records.action";

const RECENT_LIMIT = 5;

interface Props {
  /** Bumped by the parent after a successful save to trigger a refetch. */
  refreshKey: number;
  onSelect: (lessonId: string) => void;
}

const formatDate = (iso: string, locale: string): string => {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/**
 * Client-fetched (not server-loaded via the page): this list must reflect a
 * bulk-create that just happened in the same session, and it's cheap/caller-
 * scoped, so a plain client refetch keyed on `refreshKey` is simpler than
 * threading a server-side cache tag through the page for a sidebar widget.
 */
export const RecentRecordsCard = ({ refreshKey, onSelect }: Props) => {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [items, setItems] = useState<RecentLessonRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRecentLessonRecordsAction(RECENT_LIMIT, locale)
      .then((res) => {
        if (cancelled) return;
        if (res.success) setItems(res.data);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey, locale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentTitle")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("recentSubtitle")}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("recentEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={`${item.lessonId}-${item.recordedAt}`}>
                <button
                  type="button"
                  onClick={() => onSelect(item.lessonId)}
                  className="flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition hover:bg-accent"
                >
                  <span className="text-sm font-medium truncate">
                    {item.lessonName ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {[
                      item.areaName ?? "—",
                      t("summaryChildrenCount", { count: item.studentCount }),
                      formatDate(item.recordedAt, locale),
                    ].join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
