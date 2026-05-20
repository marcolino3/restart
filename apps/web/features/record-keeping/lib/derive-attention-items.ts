import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import type { LessonLifecycle } from "./derive-lesson-lifecycle";

export type AttentionReason =
  | "NEEDS_MORE_CURRENT"
  | "REPEATED_NEEDS_MORE"
  | "STUCK_PRACTICED"
  | "STUCK_INTRODUCED"
  | "BIG_GAP_INTRO_TO_PRACTICED"
  /* Observation-driven signals (Hattie / Montessori). Not lesson-bound — the
   * `lessonId` slot carries a synthetic key so the list dedupes correctly. */
  | "LOW_CONFIDENCE"
  | "GIVES_UP_PATTERN"
  | "MATERIAL_TOO_HARD"
  | "CONFIDENCE_DROP";

export type AttentionItem = {
  lessonId: string;
  lessonName: string;
  ancestors: LessonLifecycle["ancestors"];
  reason: AttentionReason;
  /** 1 = highest priority, 5 = lowest. */
  severity: number;
  /** Day count surfaced as context (gap, days-since, …). For
   *  REPEATED_NEEDS_MORE this is the *count* of needs-more records. For
   *  observation-driven reasons this is the percentage 0–100. */
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

/* Observation-Schwellen — bewusst konservativ, damit nicht jedes leichte
 * Schwanken zur Warnung wird. */
const OBS_THRESHOLDS = {
  /** Mindestanzahl Records mit der jeweiligen Achse, ab der das Signal aktiviert. */
  minSampleSize: 8,
  /** LOW_CONFIDENCE: ≥ X % INSECURE in den letzten N Records. */
  lowConfidencePercent: 60,
  /** GIVES_UP_PATTERN: ≥ X % GIVES_UP in den letzten N Records. */
  givesUpPercent: 40,
  /** MATERIAL_TOO_HARD: ≥ X % TOO_HARD in einer Area. */
  tooHardPercent: 50,
  /** CONFIDENCE_DROP: Differenz zwischen jüngsten und älteren Confidence-Werten. */
  confidenceDropThreshold: 0.5,
  /** Fenster (Records) für jüngste Werte. */
  recentWindow: 5,
  /** Fenster davor (zum Vergleich). */
  baselineWindow: 10,
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
 *
 * When `records` is provided, observation-driven signals (LOW_CONFIDENCE,
 * GIVES_UP_PATTERN, MATERIAL_TOO_HARD, CONFIDENCE_DROP) are derived from
 * the raw record stream and appended. They are not lesson-bound — the
 * synthetic `lessonId` keeps the list dedupe-safe.
 */
export function deriveAttentionItems(
  lifecycles: LessonLifecycle[],
  thresholds: AttentionThresholds = DEFAULT_ATTENTION_THRESHOLDS,
  today: Date = new Date(),
  records?: StudentLessonRecordItem[],
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

  if (records && records.length > 0) {
    items.push(...deriveObservationAttentionItems(records));
  }

  return items.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity - b.severity;
    const ad = a.days ?? 0;
    const bd = b.days ?? 0;
    return bd - ad;
  });
}

/* ────────────────────────────────────────────────────────────────────────
 * Observation-driven signals (Phase 1.C)
 * Pure derivation from the raw record stream. Synthetic lessonId so the UI
 * still uses one card per item.
 * ──────────────────────────────────────────────────────────────────────── */

function deriveObservationAttentionItems(
  records: StudentLessonRecordItem[],
): AttentionItem[] {
  const out: AttentionItem[] = [];
  const sorted = [...records].sort((a, b) => {
    if (a.recordedAt !== b.recordedAt)
      return a.recordedAt.localeCompare(b.recordedAt);
    return a.id.localeCompare(b.id);
  });
  const latestDate = sorted.length
    ? sorted[sorted.length - 1].recordedAt
    : null;

  // LOW_CONFIDENCE
  const withConf = sorted.filter((r) => r.selfConfidence != null);
  const recentConf = withConf.slice(-OBS_THRESHOLDS.recentWindow * 2);
  if (recentConf.length >= OBS_THRESHOLDS.minSampleSize) {
    const insecure = recentConf.filter(
      (r) => r.selfConfidence === "INSECURE",
    ).length;
    const pct = Math.round((insecure / recentConf.length) * 100);
    if (pct >= OBS_THRESHOLDS.lowConfidencePercent) {
      out.push({
        lessonId: "__obs:low-confidence__",
        lessonName: "",
        ancestors: [],
        reason: "LOW_CONFIDENCE",
        severity: 1,
        days: pct,
        since: latestDate,
      });
    }
  }

  // GIVES_UP_PATTERN
  const withPersistence = sorted.filter((r) => r.persistence != null);
  const recentPersistence = withPersistence.slice(
    -OBS_THRESHOLDS.recentWindow * 2,
  );
  if (recentPersistence.length >= OBS_THRESHOLDS.minSampleSize) {
    const givesUp = recentPersistence.filter(
      (r) => r.persistence === "GIVES_UP",
    ).length;
    const pct = Math.round((givesUp / recentPersistence.length) * 100);
    if (pct >= OBS_THRESHOLDS.givesUpPercent) {
      out.push({
        lessonId: "__obs:gives-up-pattern__",
        lessonName: "",
        ancestors: [],
        reason: "GIVES_UP_PATTERN",
        severity: 2,
        days: pct,
        since: latestDate,
      });
    }
  }

  // MATERIAL_TOO_HARD — pro AREA
  type AreaBucket = {
    areaId: string;
    areaName: string;
    ancestors: LessonLifecycle["ancestors"];
    total: number;
    tooHard: number;
  };
  const byArea = new Map<string, AreaBucket>();
  for (const r of sorted) {
    if (r.difficulty == null) continue;
    const area = r.lesson?.ancestors?.find((a) => a.nodeType === "AREA");
    if (!area) continue;
    const ancestors: LessonLifecycle["ancestors"] = r.lesson?.ancestors ?? [];
    const existing = byArea.get(area.id) ?? {
      areaId: area.id,
      areaName: area.translations[0]?.name ?? area.id,
      ancestors,
      total: 0,
      tooHard: 0,
    };
    existing.total += 1;
    if (r.difficulty === "TOO_HARD") existing.tooHard += 1;
    byArea.set(area.id, existing);
  }
  for (const bucket of byArea.values()) {
    if (bucket.total < OBS_THRESHOLDS.minSampleSize) continue;
    const pct = Math.round((bucket.tooHard / bucket.total) * 100);
    if (pct >= OBS_THRESHOLDS.tooHardPercent) {
      out.push({
        lessonId: `__obs:too-hard:${bucket.areaId}`,
        lessonName: bucket.areaName,
        ancestors: bucket.ancestors,
        reason: "MATERIAL_TOO_HARD",
        severity: 2,
        days: pct,
        since: latestDate,
      });
    }
  }

  // CONFIDENCE_DROP — trend reversal: jüngste {recentWindow} ggü. davor {baselineWindow}
  if (
    withConf.length >=
    OBS_THRESHOLDS.recentWindow + OBS_THRESHOLDS.baselineWindow
  ) {
    const score = (r: StudentLessonRecordItem): number =>
      r.selfConfidence === "CONFIDENT"
        ? 1
        : r.selfConfidence === "INSECURE"
          ? -1
          : 0;
    const recent = withConf.slice(-OBS_THRESHOLDS.recentWindow);
    const baseline = withConf.slice(
      -(OBS_THRESHOLDS.recentWindow + OBS_THRESHOLDS.baselineWindow),
      -OBS_THRESHOLDS.recentWindow,
    );
    const avg = (arr: StudentLessonRecordItem[]) =>
      arr.reduce((acc, r) => acc + score(r), 0) / arr.length;
    const drop = avg(baseline) - avg(recent);
    if (drop >= OBS_THRESHOLDS.confidenceDropThreshold) {
      out.push({
        lessonId: "__obs:confidence-drop__",
        lessonName: "",
        ancestors: [],
        reason: "CONFIDENCE_DROP",
        severity: 1,
        days: Math.round(drop * 100), // surfaced as "Δ" in the renderer
        since: latestDate,
      });
    }
  }

  return out;
}
