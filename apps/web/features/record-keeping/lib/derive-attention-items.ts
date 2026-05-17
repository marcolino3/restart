import type { LessonLifecycle } from "./derive-lesson-lifecycle";

export type AttentionReason =
  | "NEEDS_MORE_CURRENT"
  | "REPEATED_NEEDS_MORE"
  | "STUCK_PRACTICED"
  | "STUCK_INTRODUCED"
  | "BIG_GAP_INTRO_TO_PRACTICED";

export type AttentionItem = {
  lessonId: string;
  lessonName: string;
  ancestors: LessonLifecycle["ancestors"];
  reason: AttentionReason;
  /** 1 = highest priority, 5 = lowest. */
  severity: number;
  /** Day count surfaced as context (gap, days-since, …). For
   *  REPEATED_NEEDS_MORE this is the *count* of needs-more records. */
  days: number | null;
  /** Date the reason was triggered. */
  since: string | null;
};

export type AttentionThresholds = {
  practicedStuckDays: number;
  introducedStuckDays: number;
  bigGapDays: number;
};

export const DEFAULT_ATTENTION_THRESHOLDS: AttentionThresholds = {
  practicedStuckDays: 90,
  introducedStuckDays: 30,
  bigGapDays: 60,
};

const daysBetween = (isoDate: string, today: Date): number => {
  const a = new Date(isoDate + "T00:00:00Z").getTime();
  const b = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return Math.max(0, Math.floor((b - a) / 86_400_000));
};

/**
 * Each lifecycle yields at most one item — we surface the most severe
 * signal so a single lesson doesn't dominate the list.
 */
export function deriveAttentionItems(
  lifecycles: LessonLifecycle[],
  thresholds: AttentionThresholds = DEFAULT_ATTENTION_THRESHOLDS,
  today: Date = new Date(),
): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const l of lifecycles) {
    const mastered = l.currentStatus === "MASTERED";

    if (l.needsMore && l.lastNeedsMoreAt) {
      items.push({
        lessonId: l.lessonId,
        lessonName: l.lessonName,
        ancestors: l.ancestors,
        reason: "NEEDS_MORE_CURRENT",
        severity: 1,
        days: daysBetween(l.lastNeedsMoreAt, today),
        since: l.lastNeedsMoreAt,
      });
      continue;
    }

    const needsMoreCount = l.history.filter(
      (h) => h.status === "NEEDS_MORE",
    ).length;
    if (needsMoreCount >= 2 && !mastered) {
      items.push({
        lessonId: l.lessonId,
        lessonName: l.lessonName,
        ancestors: l.ancestors,
        reason: "REPEATED_NEEDS_MORE",
        severity: 2,
        days: needsMoreCount,
        since: l.lastNeedsMoreAt,
      });
      continue;
    }

    if (l.currentStatus === "PRACTICED" && l.practicedAt) {
      const gap = daysBetween(l.practicedAt, today);
      if (gap >= thresholds.practicedStuckDays) {
        items.push({
          lessonId: l.lessonId,
          lessonName: l.lessonName,
          ancestors: l.ancestors,
          reason: "STUCK_PRACTICED",
          severity: 3,
          days: gap,
          since: l.practicedAt,
        });
        continue;
      }
    }

    if (l.currentStatus === "INTRODUCED" && l.introducedAt) {
      const gap = daysBetween(l.introducedAt, today);
      if (gap >= thresholds.introducedStuckDays) {
        items.push({
          lessonId: l.lessonId,
          lessonName: l.lessonName,
          ancestors: l.ancestors,
          reason: "STUCK_INTRODUCED",
          severity: 4,
          days: gap,
          since: l.introducedAt,
        });
        continue;
      }
    }

    if (
      l.daysIntroToPracticed != null &&
      l.daysIntroToPracticed >= thresholds.bigGapDays &&
      !mastered
    ) {
      items.push({
        lessonId: l.lessonId,
        lessonName: l.lessonName,
        ancestors: l.ancestors,
        reason: "BIG_GAP_INTRO_TO_PRACTICED",
        severity: 5,
        days: l.daysIntroToPracticed,
        since: l.practicedAt,
      });
    }
  }

  return items.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity - b.severity;
    const ad = a.days ?? 0;
    const bd = b.days ?? 0;
    return bd - ad;
  });
}
