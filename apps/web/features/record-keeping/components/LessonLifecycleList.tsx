"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type {
  LessonLifecycle,
  LessonHistoryEntry,
} from "../lib/derive-lesson-lifecycle";
import type { AreaLessonCount } from "../actions/get-area-lesson-counts.action";
import type { LessonRecordStatus } from "../types";
import { LessonBreadcrumb } from "./LessonBreadcrumb";

interface Props {
  lifecycles: LessonLifecycle[];
  /** Used to add a curriculum suffix when multiple areas share a name
   *  (e.g. "Mathematik · Montessori Basis"). Optional — without it the
   *  filter dropdown just shows the bare name. */
  areaLessonCounts?: AreaLessonCount[];
}

type SortKey = "status" | "duration" | "recent";

// Same palette as the radar / heatmap.
const STATUS_COLOR: Record<LessonRecordStatus, string> = {
  PLANNING: "#94a3b8",
  INTRODUCED: "#0ea5e9",
  PRACTICED: "#f59e0b",
  MASTERED: "#10b981",
  NEEDS_MORE: "#f43f5e",
};

const STATUS_CHIP: Record<LessonRecordStatus, string> = {
  PLANNING: "bg-slate-100 text-slate-700 border-slate-300",
  INTRODUCED: "bg-sky-100 text-sky-800 border-sky-300",
  PRACTICED: "bg-amber-100 text-amber-800 border-amber-300",
  MASTERED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  NEEDS_MORE: "bg-rose-100 text-rose-800 border-rose-300",
};

const CURRENT_RANK: Record<LessonRecordStatus, number> = {
  // Sort order for "By current status": progress-forward first.
  MASTERED: 0,
  PRACTICED: 1,
  INTRODUCED: 2,
  NEEDS_MORE: 3,
  PLANNING: 4,
};

export function LessonLifecycleList({
  lifecycles,
  areaLessonCounts = [],
}: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  const fmtDate = (d: string | null): string =>
    d ? dateFmt.format(new Date(d + "T00:00:00Z")) : "—";

  const [areaFilter, setAreaFilter] = useState<string>("__all__");
  const [sort, setSort] = useState<SortKey>("status");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // Merge AREAs by translated name (consistent with the radar + per-area
  // accordion). Multiple curricula contributing a "Mathematik" area
  // collapse into ONE filter entry that captures ALL their area-IDs.
  const areas = useMemo(() => {
    const byName = new Map<string, { name: string; ids: Set<string> }>();
    for (const l of lifecycles) {
      if (!l.areaId) continue;
      const name = l.areaName ?? l.areaId;
      const key = name.toLocaleLowerCase().trim();
      let bucket = byName.get(key);
      if (!bucket) {
        bucket = { name, ids: new Set() };
        byName.set(key, bucket);
      }
      bucket.ids.add(l.areaId);
    }
    return Array.from(byName.entries())
      .map(([key, b]) => ({ key, name: b.name, ids: b.ids }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lifecycles]);

  // Reverse-lookup: areaId → bucket key. Used to map a lifecycle to its
  // filter bucket when the user picks one in the dropdown.
  const bucketByAreaId = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of areas) {
      for (const id of a.ids) m.set(id, a.key);
    }
    return m;
  }, [areas]);

  const filtered = useMemo(() => {
    const arr =
      areaFilter === "__all__"
        ? lifecycles
        : lifecycles.filter(
            (l) =>
              l.areaId !== null &&
              bucketByAreaId.get(l.areaId) === areaFilter,
          );
    const sorted = [...arr];
    if (sort === "status") {
      sorted.sort((a, b) => {
        const r = CURRENT_RANK[a.currentStatus] - CURRENT_RANK[b.currentStatus];
        if (r !== 0) return r;
        return a.lessonName.localeCompare(b.lessonName);
      });
    } else if (sort === "duration") {
      sorted.sort((a, b) => {
        const av = a.daysIntroToMastered ?? Number.MAX_SAFE_INTEGER;
        const bv = b.daysIntroToMastered ?? Number.MAX_SAFE_INTEGER;
        if (av !== bv) return av - bv;
        return a.lessonName.localeCompare(b.lessonName);
      });
    } else {
      sorted.sort((a, b) => {
        if (a.currentStatusAt !== b.currentStatusAt) {
          return a.currentStatusAt < b.currentStatusAt ? 1 : -1;
        }
        return a.lessonName.localeCompare(b.lessonName);
      });
    }
    return sorted;
  }, [lifecycles, areaFilter, sort, bucketByAreaId]);

  const toggleExpanded = (lessonId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  if (lifecycles.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground italic">
          {t("noLifecycleData")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle className="text-base">{t("lifecycleListTitle")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t("lifecycleListSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder={t("lifecycleFilterArea")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("lifecycleFilterArea")}</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a.key} value={a.key}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as SortKey)}
          >
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">
                {t("lifecycleSortByStatus")}
              </SelectItem>
              <SelectItem value="duration">
                {t("lifecycleSortByDuration")}
              </SelectItem>
              <SelectItem value="recent">
                {t("lifecycleSortByRecent")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.map((l) => {
          const isExpanded = expanded.has(l.lessonId);
          return (
            <div
              key={l.lessonId}
              className="rounded-md border bg-card overflow-hidden"
            >
              <div className="flex items-start gap-3 p-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(l.lessonId)}
                  className="mt-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={
                    isExpanded ? t("collapseHistory") : t("expandHistory")
                  }
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium truncate">{l.lessonName}</span>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", STATUS_CHIP[l.currentStatus])}
                    >
                      {t(l.currentStatus)}
                    </Badge>
                    {l.needsMore && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-800">
                        <AlertTriangle className="h-3 w-3" />
                        {t("NEEDS_MORE")}
                      </span>
                    )}
                  </div>
                  <LessonBreadcrumb ancestors={l.ancestors} className="mt-0.5" />

                  <LifecycleTimeline
                    introducedAt={l.introducedAt}
                    practicedAt={l.practicedAt}
                    masteredAt={l.masteredAt}
                    history={l.history}
                    fmtDate={fmtDate}
                    daysShort={t("daysShort")}
                    introducedLabel={t("INTRODUCED")}
                    practicedLabel={t("PRACTICED")}
                    masteredLabel={t("MASTERED")}
                    needsMoreLabel={t("NEEDS_MORE")}
                    todayLabel={t("today")}
                    notReachedLabel={t("notReachedYet")}
                  />
                </div>
              </div>
              {isExpanded && (
                <DetailHistory
                  history={l.history}
                  fmtDate={fmtDate}
                  statusLabel={t}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

/**
 * Gantt-style phase bar showing the lesson's life:
 *   ┌────────────┬─────────────────────────┬──────────────┐
 *   │ Einführung │ Übungsprozess           │ Gemeistert   │
 *   └─────●──────┴───────▼───▼─────────────┴──────●───────┘
 *   Mo 5.5       Übung    ↑ NEEDS_MORE      Mi 4.6
 *   (12 T)       (45 T)                     (Σ 57 T)
 *
 * Reads the full record history so re-introductions and NEEDS_MORE events
 * appear as markers on the bar — this is the "additional input" signal
 * teachers asked for.
 */
function LifecycleTimeline({
  introducedAt,
  practicedAt,
  masteredAt,
  history,
  fmtDate,
  daysShort,
  introducedLabel,
  practicedLabel,
  masteredLabel,
  needsMoreLabel,
  todayLabel,
  notReachedLabel,
}: {
  introducedAt: string | null;
  practicedAt: string | null;
  masteredAt: string | null;
  history: LessonHistoryEntry[];
  fmtDate: (d: string | null) => string;
  daysShort: string;
  introducedLabel: string;
  practicedLabel: string;
  masteredLabel: string;
  needsMoreLabel: string;
  todayLabel: string;
  notReachedLabel: string;
}) {
  if (!introducedAt) return null;

  const today = new Date().toISOString().slice(0, 10);
  const dayDiff = (later: string, earlier: string): number => {
    const a = new Date(earlier + "T00:00:00Z").getTime();
    const b = new Date(later + "T00:00:00Z").getTime();
    return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
  };

  // Total span: intro → mastered if reached, else intro → today.
  // (At least 1 day so a same-day journey still renders.)
  const endDate = masteredAt ?? today;
  const totalDays = Math.max(1, dayDiff(endDate, introducedAt));
  const pct = (date: string): number =>
    Math.min(100, Math.max(0, (dayDiff(date, introducedAt) / totalDays) * 100));

  // Three phase segments — only those with non-zero width are rendered.
  type Phase = {
    key: "INTRODUCED" | "PRACTICED" | "MASTERED";
    color: string;
    fromPct: number;
    toPct: number;
    days: number;
  };
  const phases: Phase[] = [];
  // Phase 1: from intro to (practiced ?? mastered ?? today)
  const introEnd = practicedAt ?? masteredAt ?? today;
  phases.push({
    key: "INTRODUCED",
    color: STATUS_COLOR.INTRODUCED,
    fromPct: 0,
    toPct: pct(introEnd),
    days: dayDiff(introEnd, introducedAt),
  });
  // Phase 2: from practiced to (mastered ?? today) — only if practice phase exists.
  if (practicedAt) {
    const pracEnd = masteredAt ?? today;
    phases.push({
      key: "PRACTICED",
      color: STATUS_COLOR.PRACTICED,
      fromPct: pct(practicedAt),
      toPct: pct(pracEnd),
      days: dayDiff(pracEnd, practicedAt),
    });
  }
  // Phase 3: a thin emerald cap if mastered — visually marks the goal.
  if (masteredAt) {
    phases.push({
      key: "MASTERED",
      color: STATUS_COLOR.MASTERED,
      fromPct: pct(masteredAt),
      toPct: 100,
      days: 0,
    });
  }

  // Markers from the full history: NEEDS_MORE events + re-introductions
  // (any record whose status repeats a phase already entered earlier) are
  // shown as little triangles above the bar — these are the "additional
  // inputs" beyond the linear journey.
  type Marker = {
    posPct: number;
    color: string;
    date: string;
    label: string;
  };
  const markers: Marker[] = [];
  let introCount = 0;
  let practiceCount = 0;
  for (const h of history) {
    if (h.recordedAt < introducedAt) continue; // shouldn't happen
    if (h.recordedAt > endDate) continue;
    if (h.status === "NEEDS_MORE") {
      markers.push({
        posPct: pct(h.recordedAt),
        color: STATUS_COLOR.NEEDS_MORE,
        date: h.recordedAt,
        label: needsMoreLabel,
      });
    } else if (h.status === "INTRODUCED") {
      introCount++;
      // Subsequent re-introductions are extra inputs (the first one anchors
      // the timeline and doesn't need a marker).
      if (introCount > 1) {
        markers.push({
          posPct: pct(h.recordedAt),
          color: STATUS_COLOR.INTRODUCED,
          date: h.recordedAt,
          label: introducedLabel,
        });
      }
    } else if (h.status === "PRACTICED") {
      practiceCount++;
      // Extra practice records get small inline ticks under the bar.
    }
  }
  // Practice ticks (lighter than NEEDS_MORE markers; just shows activity).
  const practiceTicks = history
    .filter((h) => h.status === "PRACTICED" && h.recordedAt >= introducedAt)
    .map((h) => pct(h.recordedAt));

  const introOffset = `calc(8px + ${0}% * (100% - 16px) / 100%)`;
  const endOffset = `calc(8px + 100% * (100% - 16px) / 100%)`;

  return (
    <div className="mt-3 select-none">
      {/* Marker row (NEEDS_MORE + re-intros) */}
      <div className="relative h-4 px-2">
        {markers.map((m, i) => (
          <span
            key={`m-${i}`}
            title={`${m.label} · ${fmtDate(m.date)}`}
            className="absolute top-0 -translate-x-1/2"
            style={{
              left: `calc(8px + ${m.posPct}% * (100% - 16px) / 100%)`,
            }}
            aria-label={`${m.label} ${fmtDate(m.date)}`}
          >
            <span
              className="block h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent"
              style={{ borderTopColor: m.color }}
            />
          </span>
        ))}
      </div>

      {/* Phase bar */}
      <div className="relative h-3 mx-2 rounded-full bg-slate-100 overflow-hidden">
        {phases.map((p) => (
          <div
            key={p.key}
            title={
              p.key === "MASTERED"
                ? `${masteredLabel} · ${fmtDate(masteredAt)}`
                : `${p.key === "INTRODUCED" ? introducedLabel : practicedLabel} · ${p.days} ${daysShort}`
            }
            className="absolute top-0 bottom-0"
            style={{
              left: `${p.fromPct}%`,
              width: `${Math.max(p.toPct - p.fromPct, 1.5)}%`,
              background: p.color,
              opacity: p.key === "MASTERED" ? 1 : 0.85,
            }}
          />
        ))}
        {/* Practice ticks under-bar */}
        {practiceTicks.map((posPct, i) => (
          <span
            key={`t-${i}`}
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-px bg-white/70"
            style={{ left: `${posPct}%` }}
          />
        ))}
      </div>

      {/* Date anchors under the bar */}
      <div className="relative h-8 mt-1 px-2">
        {/* Intro anchor (always visible) */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left: introOffset }}
        >
          <span className="text-[10px] font-medium tabular-nums text-foreground/85 whitespace-nowrap">
            {fmtDate(introducedAt)}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight whitespace-nowrap">
            {introducedLabel}
          </span>
        </div>

        {/* Practiced anchor */}
        {practicedAt && (
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
            style={{
              left: `calc(8px + ${pct(practicedAt)}% * (100% - 16px) / 100%)`,
            }}
          >
            <span className="text-[10px] font-medium tabular-nums text-foreground/85 whitespace-nowrap">
              {fmtDate(practicedAt)}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight whitespace-nowrap">
              {practicedLabel}
            </span>
          </div>
        )}

        {/* End anchor: MASTERED date, or today + "noch nicht erreicht" */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left: endOffset }}
        >
          <span className="text-[10px] font-medium tabular-nums text-foreground/85 whitespace-nowrap">
            {fmtDate(endDate)}
          </span>
          <span
            className="text-[10px] leading-tight whitespace-nowrap"
            style={{
              color: masteredAt
                ? STATUS_COLOR.MASTERED
                : "var(--color-muted-foreground)",
            }}
          >
            {masteredAt ? masteredLabel : `${todayLabel} · ${notReachedLabel}`}
          </span>
        </div>
      </div>

      {/* Duration legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground mt-1 px-2">
        {phases
          .filter((p) => p.key !== "MASTERED")
          .map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1 tabular-nums">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-sm"
                style={{ background: p.color }}
              />
              {p.key === "INTRODUCED" ? introducedLabel : practicedLabel}
              <span className="text-foreground/80">
                {p.days} {daysShort}
              </span>
            </span>
          ))}
        {masteredAt && (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-sm"
              style={{ background: STATUS_COLOR.MASTERED }}
            />
            ∑
            <span className="font-medium text-foreground">
              {dayDiff(masteredAt, introducedAt)} {daysShort}
            </span>
          </span>
        )}
        {markers.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <span
              aria-hidden="true"
              className="block h-0 w-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent"
              style={{ borderTopColor: STATUS_COLOR.NEEDS_MORE }}
            />
            {markers.length}× {needsMoreLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function DetailHistory({
  history,
  fmtDate,
  statusLabel,
}: {
  history: LessonHistoryEntry[];
  fmtDate: (d: string | null) => string;
  statusLabel: (key: string) => string;
}) {
  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      <ol className="space-y-1.5">
        {history.map((h, i) => (
          <li
            key={`${h.recordedAt}-${i}`}
            className="flex items-start gap-3 text-xs"
          >
            <span
              className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
              style={{ background: STATUS_COLOR[h.status] }}
              aria-hidden="true"
            />
            <span className="w-24 tabular-nums text-muted-foreground">
              {fmtDate(h.recordedAt)}
            </span>
            <span className="font-medium">{statusLabel(h.status)}</span>
            {h.recordedBy && (h.recordedBy.firstName || h.recordedBy.lastName) && (
              <span className="text-muted-foreground">
                · {h.recordedBy.firstName ?? ""} {h.recordedBy.lastName ?? ""}
              </span>
            )}
            {h.note && (
              <span className="text-muted-foreground italic truncate">
                · {h.note}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}