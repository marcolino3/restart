import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import type { LessonRecordStatus } from "../types";

// Loose ancestor shape — accepts the GraphQL payload's `locale: string`
// without forcing the consumer to coerce to `CurriculumLocale`.
type LifecycleAncestor = {
  id: string;
  nodeType: "AREA" | "TOPIC" | "GROUP" | "LESSON";
  translations: { locale: string; name: string }[];
};

export type LessonHistoryEntry = {
  recordedAt: string;
  status: LessonRecordStatus;
  note?: string | null;
  recordedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
};

export type LessonLifecycle = {
  lessonId: string;
  lessonName: string;
  /** Raw ancestors chain from the GQL payload — kept for breadcrumb
   *  rendering elsewhere without re-deriving translations. */
  ancestors: LifecycleAncestor[];
  areaId: string | null;
  areaName: string | null;
  topicId: string | null;
  topicName: string | null;
  groupId: string | null;
  groupName: string | null;

  /** Latest status (used to pick the "current" pill). */
  currentStatus: LessonRecordStatus;
  /** Date of the latest record. */
  currentStatusAt: string;

  /** First date each *progression* status was reached.
   *  PLANNING and NEEDS_MORE are tracked separately below. */
  introducedAt: string | null;
  practicedAt: string | null;
  masteredAt: string | null;

  /** Whether the lesson is currently flagged as needing more practice. */
  needsMore: boolean;
  /** Last NEEDS_MORE record date (for the timeline marker). */
  lastNeedsMoreAt: string | null;

  /** Day deltas between progression milestones. `null` if the journey
   *  hasn't reached the second milestone yet. */
  daysIntroToPracticed: number | null;
  daysPracticedToMastered: number | null;
  daysIntroToMastered: number | null;

  /** All records for this lesson, sorted ASC by recordedAt. */
  history: LessonHistoryEntry[];
};

const pickName = (
  translations: { locale: string; name: string }[] | undefined,
  locale: string,
): string => {
  if (!translations || translations.length === 0) return "—";
  const normalized = locale.toUpperCase();
  return (
    translations.find((t) => t.locale === normalized)?.name ??
    translations[0]?.name ??
    "—"
  );
};

const diffInDays = (later: string, earlier: string): number => {
  // Both are "YYYY-MM-DD" date strings. Plain difference on the day level —
  // we don't care about timezones or hours.
  const a = new Date(earlier + "T00:00:00Z").getTime();
  const b = new Date(later + "T00:00:00Z").getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
};

/**
 * Derives per-lesson lifecycles from the flat record stream.
 *
 * Rules:
 *  - The "first date" of a status is the earliest record matching it
 *    (re-recording a status doesn't reset the milestone).
 *  - Once MASTERED has been reached we still keep the lesson visible even
 *    if a later record downgrades it.
 *  - PLANNING records are kept in history but don't drive milestones (it's
 *    a forward-looking state, not progress).
 */
export function deriveLessonLifecycles(
  records: StudentLessonRecordItem[],
  locale: string,
): LessonLifecycle[] {
  const byLesson = new Map<string, StudentLessonRecordItem[]>();
  for (const r of records) {
    if (!byLesson.has(r.lessonId)) byLesson.set(r.lessonId, []);
    byLesson.get(r.lessonId)!.push(r);
  }

  const lifecycles: LessonLifecycle[] = [];
  for (const [lessonId, list] of byLesson.entries()) {
    const sorted = [...list].sort((a, b) => {
      if (a.recordedAt !== b.recordedAt) {
        return a.recordedAt < b.recordedAt ? -1 : 1;
      }
      // Stable tiebreaker so same-day records keep a deterministic order.
      return a.id < b.id ? -1 : 1;
    });

    const earliestByStatus = new Map<LessonRecordStatus, string>();
    for (const r of sorted) {
      if (!earliestByStatus.has(r.status)) {
        earliestByStatus.set(r.status, r.recordedAt);
      }
    }
    const introducedAt = earliestByStatus.get("INTRODUCED") ?? null;
    const practicedAt = earliestByStatus.get("PRACTICED") ?? null;
    const masteredAt = earliestByStatus.get("MASTERED") ?? null;

    // Last NEEDS_MORE record (if any).
    let lastNeedsMoreAt: string | null = null;
    let needsMore = false;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].status === "NEEDS_MORE") {
        lastNeedsMoreAt = sorted[i].recordedAt;
        // currently NEEDS_MORE only if it's the latest record.
        if (i === sorted.length - 1) needsMore = true;
        break;
      }
    }

    const latest = sorted[sorted.length - 1];
    const ancestors = latest.lesson?.ancestors ?? [];
    const area = ancestors.find((a) => a.nodeType === "AREA");
    const topic = ancestors.find((a) => a.nodeType === "TOPIC");
    const group = ancestors.find((a) => a.nodeType === "GROUP");

    lifecycles.push({
      lessonId,
      lessonName: pickName(latest.lesson?.translations, locale),
      ancestors,
      areaId: area?.id ?? null,
      areaName: area ? pickName(area.translations, locale) : null,
      topicId: topic?.id ?? null,
      topicName: topic ? pickName(topic.translations, locale) : null,
      groupId: group?.id ?? null,
      groupName: group ? pickName(group.translations, locale) : null,
      currentStatus: latest.status,
      currentStatusAt: latest.recordedAt,
      introducedAt,
      practicedAt,
      masteredAt,
      needsMore,
      lastNeedsMoreAt,
      daysIntroToPracticed:
        introducedAt && practicedAt
          ? diffInDays(practicedAt, introducedAt)
          : null,
      daysPracticedToMastered:
        practicedAt && masteredAt
          ? diffInDays(masteredAt, practicedAt)
          : null,
      daysIntroToMastered:
        introducedAt && masteredAt
          ? diffInDays(masteredAt, introducedAt)
          : null,
      history: sorted.map((r) => ({
        recordedAt: r.recordedAt,
        status: r.status,
        note: r.note,
        recordedBy: r.recordedBy,
      })),
    });
  }
  return lifecycles;
}

// ─── Aggregates ──────────────────────────────────────────────────────────────

export type LifecycleAggregates = {
  trackedCount: number;
  masteredCount: number;
  practicedCount: number;
  introducedCount: number;
  needsMoreCount: number;

  avgDaysIntroToPracticed: number | null;
  avgDaysPracticedToMastered: number | null;
  avgDaysIntroToMastered: number | null;

  fastestMastery: { lessonName: string; days: number } | null;
  slowestMastery: { lessonName: string; days: number } | null;
};

const avg = (xs: number[]): number | null =>
  xs.length === 0 ? null : Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

export function deriveLifecycleAggregates(
  lifecycles: LessonLifecycle[],
): LifecycleAggregates {
  let mastered = 0;
  let practiced = 0;
  let introduced = 0;
  let needsMoreCount = 0;
  const introToPracticed: number[] = [];
  const practicedToMastered: number[] = [];
  const introToMastered: number[] = [];
  let fastest: { lessonName: string; days: number } | null = null;
  let slowest: { lessonName: string; days: number } | null = null;

  for (const l of lifecycles) {
    if (l.currentStatus === "MASTERED") mastered++;
    else if (l.currentStatus === "PRACTICED") practiced++;
    else if (l.currentStatus === "INTRODUCED") introduced++;
    if (l.needsMore) needsMoreCount++;

    if (l.daysIntroToPracticed !== null)
      introToPracticed.push(l.daysIntroToPracticed);
    if (l.daysPracticedToMastered !== null)
      practicedToMastered.push(l.daysPracticedToMastered);
    if (l.daysIntroToMastered !== null) {
      introToMastered.push(l.daysIntroToMastered);
      if (!fastest || l.daysIntroToMastered < fastest.days) {
        fastest = { lessonName: l.lessonName, days: l.daysIntroToMastered };
      }
      if (!slowest || l.daysIntroToMastered > slowest.days) {
        slowest = { lessonName: l.lessonName, days: l.daysIntroToMastered };
      }
    }
  }

  return {
    trackedCount: lifecycles.length,
    masteredCount: mastered,
    practicedCount: practiced,
    introducedCount: introduced,
    needsMoreCount,
    avgDaysIntroToPracticed: avg(introToPracticed),
    avgDaysPracticedToMastered: avg(practicedToMastered),
    avgDaysIntroToMastered: avg(introToMastered),
    fastestMastery: fastest,
    slowestMastery: slowest,
  };
}
