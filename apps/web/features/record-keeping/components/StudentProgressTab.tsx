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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import type { AreaOption } from "../actions/get-org-areas.action";
import type { AreaLessonCount } from "../actions/get-area-lesson-counts.action";
import { StudentAreaRadar } from "./StudentAreaRadar";
import { LessonBreadcrumb } from "./LessonBreadcrumb";
import { LessonLifecycleCharts } from "./LessonLifecycleCharts";
import { LessonLifecycleInsights } from "./LessonLifecycleInsights";
import { LessonLifecycleSummaryCards } from "./LessonLifecycleSummaryCards";
import { AttentionList } from "./AttentionList";
import {
  deriveLessonLifecycles,
  deriveLifecycleAggregates,
} from "../lib/derive-lesson-lifecycle";
import {
  deriveAttentionItems,
  DEFAULT_ATTENTION_THRESHOLDS,
  type AttentionThresholds,
} from "../lib/derive-attention-items";
import {
  LESSON_RECORD_STATUSES,
  type LessonOption,
  type LessonRecordStatus,
} from "../types";

interface Props {
  records: StudentLessonRecordItem[];
  nextLessons: LessonOption[];
  allAreas?: AreaOption[];
  areaLessonCounts?: AreaLessonCount[];
  /** All LESSON nodes in the curriculum — used to render untouched
   *  lessons greyed-out alongside the ones with records. */
  allLessons?: LessonOption[];
  /** Org-tunable thresholds. Falls back to defaults when omitted. */
  attentionThresholds?: AttentionThresholds;
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

type CurrentByLesson = Map<string, StudentLessonRecordItem>;

export function StudentProgressTab({
  records,
  nextLessons,
  allAreas = [],
  areaLessonCounts = [],
  allLessons = [],
  attentionThresholds = DEFAULT_ATTENTION_THRESHOLDS,
}: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<LessonRecordStatus | null>(
    null,
  );

  // ─── Light, shared computations (cheap — fine to run on every render) ─────

  const currentByLesson = useMemo<CurrentByLesson>(() => {
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

  return (
    <div className="flex flex-col gap-6">
      {/* Nested tabs — heavy derivations live in the sub-section components
          and only run when their tab is active (Radix unmounts inactive
          content by default). */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">{t("subtabOverview")}</TabsTrigger>
          <TabsTrigger value="attention">{t("subtabAttention")}</TabsTrigger>
          <TabsTrigger value="areas">{t("subtabAreas")}</TabsTrigger>
          <TabsTrigger value="lifecycle">{t("subtabLifecycle")}</TabsTrigger>
          <TabsTrigger value="activity">{t("subtabActivity")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewSection
            records={records}
            locale={locale}
            allAreas={allAreas}
            areaLessonCounts={areaLessonCounts}
          />
        </TabsContent>

        <TabsContent value="attention" className="mt-6">
          <AttentionSection
            records={records}
            locale={locale}
            attentionThresholds={attentionThresholds}
          />
        </TabsContent>

        <TabsContent value="areas" className="mt-6">
          <AreaGroupsSection
            currentByLesson={currentByLesson}
            allLessons={allLessons}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusCounts={statusCounts}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-6">
          <LifecycleSection
            records={records}
            locale={locale}
            areaLessonCounts={areaLessonCounts}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivitySection records={records} nextLessons={nextLessons} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-sections (mounted lazily by their parent <TabsContent>) ───────────

interface OverviewSectionProps {
  records: StudentLessonRecordItem[];
  locale: string;
  allAreas: AreaOption[];
  areaLessonCounts: AreaLessonCount[];
}

function OverviewSection({
  records,
  locale,
  allAreas,
  areaLessonCounts,
}: OverviewSectionProps) {
  const lifecycles = useMemo(
    () => deriveLessonLifecycles(records, locale),
    [records, locale],
  );
  const lifecycleAggregates = useMemo(
    () => deriveLifecycleAggregates(lifecycles),
    [lifecycles],
  );

  return (
    <div className="flex flex-col gap-6">
      {lifecycles.length > 0 && (
        <>
          <LessonLifecycleSummaryCards aggregates={lifecycleAggregates} />
          <LessonLifecycleCharts lifecycles={lifecycles} />
        </>
      )}
      <StudentAreaRadar
        records={records}
        allAreas={allAreas}
        areaLessonCounts={areaLessonCounts}
      />
    </div>
  );
}

// ─── Area-Groups section ──────────────────────────────────────────────────

type LessonEntry = {
  lessonId: string;
  lessonName: string;
  lessonPosition: number;
  record: StudentLessonRecordItem | null;
};

type GroupBucket = {
  groupKey: string;
  groupName: string | null;
  position: number;
  lessons: LessonEntry[];
};

type TopicBucket = {
  topicKey: string;
  topicName: string | null;
  position: number;
  groups: GroupBucket[];
  lessonCount: number;
};

type AreaGroup = {
  areaKey: string;
  areaName: string;
  position: number;
  topics: TopicBucket[];
  lessonCount: number;
};

const UNGROUPED_AREA_KEY = "__ungrouped__";
const NO_TOPIC_KEY = "__no_topic__";
const NO_GROUP_KEY = "__no_group__";
const POS_INF = Number.MAX_SAFE_INTEGER;

interface AreaGroupsSectionProps {
  currentByLesson: CurrentByLesson;
  allLessons: LessonOption[];
  statusFilter: LessonRecordStatus | null;
  setStatusFilter: (next: LessonRecordStatus | null) => void;
  statusCounts: Record<LessonRecordStatus, number>;
  locale: string;
}

function AreaGroupsSection({
  currentByLesson,
  allLessons,
  statusFilter,
  setStatusFilter,
  statusCounts,
  locale,
}: AreaGroupsSectionProps) {
  const t = useTranslations("RecordKeeping");
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const areaGroups = useMemo<AreaGroup[]>(() => {
    const areas = new Map<string, AreaGroup>();

    type LooseAncestor = {
      id: string;
      nodeType: "AREA" | "TOPIC" | "GROUP" | "LESSON";
      position?: number;
      translations: { locale: string; name: string }[];
    };
    type IteratedLesson = {
      lessonId: string;
      lessonName: string;
      lessonPosition: number;
      ancestors: LooseAncestor[] | undefined;
      record: StudentLessonRecordItem | null;
    };
    const iter: IteratedLesson[] = [];
    if (allLessons.length > 0) {
      for (const l of allLessons) {
        const rec = currentByLesson.get(l.id) ?? null;
        iter.push({
          lessonId: l.id,
          lessonName: pickName(l.translations, locale),
          lessonPosition: l.position,
          ancestors: l.ancestors,
          record: rec,
        });
      }
    } else {
      for (const rec of currentByLesson.values()) {
        iter.push({
          lessonId: rec.lessonId,
          lessonName: rec.lesson
            ? pickName(rec.lesson.translations, locale)
            : rec.lessonId,
          lessonPosition: rec.lesson?.position ?? POS_INF,
          ancestors: rec.lesson?.ancestors,
          record: rec,
        });
      }
    }

    for (const item of iter) {
      if (statusFilter) {
        if (!item.record || item.record.status !== statusFilter) continue;
      }
      const ancestors = item.ancestors ?? [];
      const area = ancestors.find((a) => a.nodeType === "AREA");
      const topic = ancestors.find((a) => a.nodeType === "TOPIC");
      const group = ancestors.find((a) => a.nodeType === "GROUP");

      const areaName = area
        ? pickName(area.translations, locale)
        : t("title");
      const areaKey = area
        ? areaName.toLocaleLowerCase().trim()
        : UNGROUPED_AREA_KEY;
      const topicName = topic ? pickName(topic.translations, locale) : null;
      const topicKey = topic?.id ?? NO_TOPIC_KEY;
      const groupName = group ? pickName(group.translations, locale) : null;
      const groupKey = group?.id ?? NO_GROUP_KEY;
      const lessonName = item.lessonName;
      const lessonPosition = item.lessonPosition;
      const areaPos = area?.position ?? POS_INF;
      const topicPos = topic?.position ?? POS_INF;
      const groupPos = group?.position ?? POS_INF;

      let areaBucket = areas.get(areaKey);
      if (!areaBucket) {
        areaBucket = {
          areaKey,
          areaName,
          position: areaPos,
          topics: [],
          lessonCount: 0,
        };
        areas.set(areaKey, areaBucket);
      } else if (areaPos < areaBucket.position) {
        areaBucket.position = areaPos;
      }
      let topicBucket = areaBucket.topics.find((b) => b.topicKey === topicKey);
      if (!topicBucket) {
        topicBucket = {
          topicKey,
          topicName,
          position: topicPos,
          groups: [],
          lessonCount: 0,
        };
        areaBucket.topics.push(topicBucket);
      } else if (topicPos < topicBucket.position) {
        topicBucket.position = topicPos;
      }
      let groupBucket = topicBucket.groups.find((b) => b.groupKey === groupKey);
      if (!groupBucket) {
        groupBucket = {
          groupKey,
          groupName,
          position: groupPos,
          lessons: [],
        };
        topicBucket.groups.push(groupBucket);
      } else if (groupPos < groupBucket.position) {
        groupBucket.position = groupPos;
      }
      groupBucket.lessons.push({
        lessonId: item.lessonId,
        lessonName,
        lessonPosition,
        record: item.record,
      });
      topicBucket.lessonCount += 1;
      areaBucket.lessonCount += 1;
    }

    const byPosThenName = <T extends { position: number; name: string }>(
      a: T,
      b: T,
    ) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.name.localeCompare(b.name);
    };

    const sortedAreas = Array.from(areas.values()).sort((a, b) =>
      byPosThenName(
        { position: a.position, name: a.areaName },
        { position: b.position, name: b.areaName },
      ),
    );
    for (const area of sortedAreas) {
      area.topics.sort((a, b) =>
        byPosThenName(
          { position: a.position, name: a.topicName ?? "￿" },
          { position: b.position, name: b.topicName ?? "￿" },
        ),
      );
      for (const topic of area.topics) {
        topic.groups.sort((a, b) =>
          byPosThenName(
            { position: a.position, name: a.groupName ?? "￿" },
            { position: b.position, name: b.groupName ?? "￿" },
          ),
        );
        for (const group of topic.groups) {
          group.lessons.sort((a, b) =>
            byPosThenName(
              { position: a.lessonPosition, name: a.lessonName },
              { position: b.lessonPosition, name: b.lessonName },
            ),
          );
        }
      }
    }
    return sortedAreas;
  }, [currentByLesson, statusFilter, locale, t, allLessons]);

  const toggleArea = (id: string) =>
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      {/* Status-Filter-Cards: klicken filtert die Area-Liste unten;
          erneuter Klick auf den aktiven Status hebt den Filter wieder auf. */}
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
              aria-pressed={active}
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

      {statusFilter && (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            ✕ {t(statusFilter)}
          </Button>
        </div>
      )}

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
            {areaGroups.map((area) => {
              const isExpanded = expandedAreas.has(area.areaKey);
              return (
                <div key={area.areaKey} className="rounded-md border">
                  <button
                    type="button"
                    onClick={() => toggleArea(area.areaKey)}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent rounded-md"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium text-sm">{area.areaName}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {area.lessonCount}
                    </Badge>
                  </button>
                  {isExpanded && (
                    <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
                      {area.topics.map((topic, topicIdx) => (
                        <div
                          key={topic.topicKey}
                          className={cn(
                            "flex flex-col gap-2 pl-3 border-l-2 border-border/70",
                            topicIdx > 0 && "mt-1",
                          )}
                        >
                          {topic.topicName && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-semibold text-foreground/85">
                                {topic.topicName}
                              </span>
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {topic.lessonCount}
                              </span>
                            </div>
                          )}
                          {topic.groups.map((group) => (
                            <div
                              key={group.groupKey}
                              className="flex flex-col gap-1 pl-3 border-l border-border/60"
                            >
                              {group.groupName && (
                                <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground/80">
                                  {group.groupName}
                                </span>
                              )}
                              <ul className="flex flex-col">
                                {group.lessons.map(
                                  ({ lessonId, lessonName, record }) => {
                                    const untouched = record === null;
                                    return (
                                      <li
                                        key={lessonId}
                                        className={cn(
                                          "flex items-center gap-2 rounded px-2 py-1 hover:bg-accent/60",
                                          untouched && "opacity-50",
                                        )}
                                      >
                                        <span
                                          aria-hidden="true"
                                          className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            untouched
                                              ? "bg-muted-foreground/30"
                                              : "bg-foreground/30",
                                          )}
                                        />
                                        <span
                                          className={cn(
                                            "text-sm flex-1 truncate",
                                            untouched &&
                                              "text-muted-foreground italic",
                                          )}
                                        >
                                          {lessonName}
                                        </span>
                                        {record ? (
                                          <>
                                            <Badge
                                              variant="outline"
                                              className={`text-[10px] uppercase ${STATUS_CLS[record.status]}`}
                                            >
                                              {t(record.status)}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                                              {formatDate(record.recordedAt)}
                                            </span>
                                          </>
                                        ) : (
                                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                                            {t("untouched")}
                                          </span>
                                        )}
                                      </li>
                                    );
                                  },
                                )}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Attention section ────────────────────────────────────────────────────

interface AttentionSectionProps {
  records: StudentLessonRecordItem[];
  locale: string;
  attentionThresholds: AttentionThresholds;
}

function AttentionSection({
  records,
  locale,
  attentionThresholds,
}: AttentionSectionProps) {
  const t = useTranslations("RecordKeeping");
  const lifecycles = useMemo(
    () => deriveLessonLifecycles(records, locale),
    [records, locale],
  );
  const attentionItems = useMemo(
    () => deriveAttentionItems(lifecycles, attentionThresholds),
    [lifecycles, attentionThresholds],
  );

  if (attentionItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {t("noAttentionItems")}
      </p>
    );
  }
  return <AttentionList items={attentionItems} />;
}

// ─── Lifecycle section ────────────────────────────────────────────────────

interface LifecycleSectionProps {
  records: StudentLessonRecordItem[];
  locale: string;
  areaLessonCounts: AreaLessonCount[];
}

function LifecycleSection({
  records,
  locale,
  areaLessonCounts,
}: LifecycleSectionProps) {
  const lifecycles = useMemo(
    () => deriveLessonLifecycles(records, locale),
    [records, locale],
  );
  return (
    <LessonLifecycleInsights
      lifecycles={lifecycles}
      areaLessonCounts={areaLessonCounts}
    />
  );
}

// ─── Activity section ─────────────────────────────────────────────────────

interface ActivitySectionProps {
  records: StudentLessonRecordItem[];
  nextLessons: LessonOption[];
}

function ActivitySection({ records, nextLessons }: ActivitySectionProps) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();

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
            <p className="text-sm text-muted-foreground">{t("noNextLessons")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {nextLessons.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-col gap-1 rounded-md border bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">
                      {pickName(l.translations, locale)}
                    </span>
                    {l.lessonType && (
                      <Badge variant="secondary" className="text-[10px]">
                        {l.lessonType === "THREE_PL" ? "3PL" : l.lessonType}
                      </Badge>
                    )}
                  </div>
                  <LessonBreadcrumb ancestors={l.ancestors} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
