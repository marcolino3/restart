/**
 * Server-side mirror of `apps/web/features/record-keeping/lib/derive-attention-items.ts`
 * and the subset of `derive-lesson-lifecycle.ts` needed to compute it.
 *
 * Kept duplicated (not shared via package) because the backend uses
 * CommonJS and the web package uses ESM — bridging the two would cost
 * more than the ~120 lines of pure logic below.
 *
 * KEEP IN SYNC with the web-side files when the heuristic changes.
 */

import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';

export type AttentionReason =
  | 'NEEDS_MORE_CURRENT'
  | 'REPEATED_NEEDS_MORE'
  | 'STUCK_PRACTICED'
  | 'STUCK_INTRODUCED'
  | 'BIG_GAP_INTRO_TO_PRACTICED';

export type AttentionThresholds = {
  introducedStuckDays: number;
  practicedStuckDays: number;
  bigGapDays: number;
};

export const DEFAULT_ATTENTION_THRESHOLDS: AttentionThresholds = {
  introducedStuckDays: 30,
  practicedStuckDays: 90,
  bigGapDays: 60,
};

/** Slim record shape — just what the heuristic needs. */
export interface AttentionRecordInput {
  id: string;
  studentId: string;
  lessonId: string;
  recordedAt: string;
  status: LessonRecordStatus;
  lesson?: {
    id: string;
    translations: { locale: string; name: string }[];
    ancestors?: Array<{
      id: string;
      nodeType: string;
      translations: { locale: string; name: string }[];
    }>;
  } | null;
}

export interface AttentionItemOut {
  lessonId: string;
  lessonName: string;
  ancestors: Array<{
    id: string;
    nodeType: string;
    translations: { locale: string; name: string }[];
  }>;
  reason: AttentionReason;
  severity: number;
  days: number | null;
  since: string | null;
}

const pickName = (
  translations: { locale: string; name: string }[] | undefined,
  locale: string,
): string => {
  if (!translations || translations.length === 0) return '—';
  const normalized = locale.toUpperCase();
  return (
    translations.find((t) => t.locale === normalized)?.name ??
    translations[0]?.name ??
    '—'
  );
};

const daysBetween = (isoDate: string, today: Date): number => {
  const a = new Date(isoDate + 'T00:00:00Z').getTime();
  const b = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return Math.max(0, Math.floor((b - a) / 86_400_000));
};

/** Diff between two YYYY-MM-DD strings. Matches the frontend helper. */
const diffInDays = (later: string, earlier: string): number => {
  const a = new Date(earlier + 'T00:00:00Z').getTime();
  const b = new Date(later + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86_400_000);
};

/**
 * Computes attention items for ONE student given their record stream.
 * Returns at most one item per lesson (highest-severity wins).
 */
export function deriveStudentAttentionItems(
  records: AttentionRecordInput[],
  locale: string,
  thresholds: AttentionThresholds = DEFAULT_ATTENTION_THRESHOLDS,
  today: Date = new Date(),
): AttentionItemOut[] {
  // Group by lessonId
  const byLesson = new Map<string, AttentionRecordInput[]>();
  for (const r of records) {
    if (!byLesson.has(r.lessonId)) byLesson.set(r.lessonId, []);
    byLesson.get(r.lessonId)!.push(r);
  }

  const items: AttentionItemOut[] = [];

  for (const [lessonId, list] of byLesson.entries()) {
    const sorted = [...list].sort((a, b) => {
      if (a.recordedAt !== b.recordedAt)
        return a.recordedAt < b.recordedAt ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    });

    const earliestByStatus = new Map<LessonRecordStatus, string>();
    for (const r of sorted) {
      if (!earliestByStatus.has(r.status)) {
        earliestByStatus.set(r.status, r.recordedAt);
      }
    }
    const introducedAt =
      earliestByStatus.get(LessonRecordStatus.INTRODUCED) ?? null;
    const practicedAt =
      earliestByStatus.get(LessonRecordStatus.PRACTICED) ?? null;
    const masteredAt =
      earliestByStatus.get(LessonRecordStatus.MASTERED) ?? null;

    let lastNeedsMoreAt: string | null = null;
    let needsMore = false;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].status === LessonRecordStatus.NEEDS_MORE) {
        lastNeedsMoreAt = sorted[i].recordedAt;
        if (i === sorted.length - 1) needsMore = true;
        break;
      }
    }

    const latest = sorted[sorted.length - 1];
    const ancestors = latest.lesson?.ancestors ?? [];
    const lessonName = pickName(latest.lesson?.translations, locale);
    const mastered = latest.status === LessonRecordStatus.MASTERED;

    const push = (
      reason: AttentionReason,
      severity: number,
      days: number | null,
      since: string | null,
    ) => {
      items.push({
        lessonId,
        lessonName,
        ancestors,
        reason,
        severity,
        days,
        since,
      });
    };

    if (needsMore && lastNeedsMoreAt) {
      push('NEEDS_MORE_CURRENT', 1, daysBetween(lastNeedsMoreAt, today), lastNeedsMoreAt);
      continue;
    }

    const needsMoreCount = sorted.filter(
      (r) => r.status === LessonRecordStatus.NEEDS_MORE,
    ).length;
    if (needsMoreCount >= 2 && !mastered) {
      push('REPEATED_NEEDS_MORE', 2, needsMoreCount, lastNeedsMoreAt);
      continue;
    }

    if (latest.status === LessonRecordStatus.PRACTICED && practicedAt) {
      const gap = daysBetween(practicedAt, today);
      if (gap >= thresholds.practicedStuckDays) {
        push('STUCK_PRACTICED', 3, gap, practicedAt);
        continue;
      }
    }

    if (latest.status === LessonRecordStatus.INTRODUCED && introducedAt) {
      const gap = daysBetween(introducedAt, today);
      if (gap >= thresholds.introducedStuckDays) {
        push('STUCK_INTRODUCED', 4, gap, introducedAt);
        continue;
      }
    }

    if (introducedAt && practicedAt && !mastered) {
      const gap = diffInDays(practicedAt, introducedAt);
      if (gap >= thresholds.bigGapDays) {
        push('BIG_GAP_INTRO_TO_PRACTICED', 5, gap, practicedAt);
      }
    }
  }

  return items.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity - b.severity;
    return (b.days ?? 0) - (a.days ?? 0);
  });
}
