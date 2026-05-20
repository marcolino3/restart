import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import type {
  LessonRecordConcentration,
  LessonRecordEngagement,
  LessonRecordPersistence,
  LessonRecordSelfConfidence,
  LessonRecordStatus,
} from "../types";

/* ────────────────────────────────────────────────────────────────────────
 * Datenmenge-Schwellen
 * Phase-3-Komponenten (Radar, Self-Assessment-Kalibrierung) brauchen
 * Längsschnitt-Daten — bei zu wenigen Records zeigen die Karten eine
 * "Noch nicht genug Daten"-Meldung statt rauschige Charts.
 * ──────────────────────────────────────────────────────────────────────── */

export const OBSERVATION_METRICS_THRESHOLDS = {
  /** Phase 1 — schon ab wenigen Records sinnvoll. */
  cardMinRecords: 3,
  /** Phase 3.B — Visible-Learner-Radar. */
  radarMinRecords: 20,
  /** Phase 3.E — Self-Assessment-Kalibrierung (braucht Self-Tap-Längsschnitt). */
  calibrationMinSelfAssessments: 5,
  /** Anzahl Records für Trend-Sparklines (jüngste). Großzügig — Filter
   *  übernimmt der Zeitfenster-Selektor auf der Tab-Ebene. */
  sparklineWindow: 200,
  /** Trend-Fenster für Confidence-/Persistence-Wertungen. */
  recentWindow: 10,
} as const;

/* ────────────────────────────────────────────────────────────────────────
 * Score-Mappings
 * ──────────────────────────────────────────────────────────────────────── */

const ENGAGEMENT_SCORE: Record<LessonRecordEngagement, number> = {
  FOCUSED: 3,
  INTERESTED: 2,
  MECHANICAL: 1,
  RESISTANT: 0,
};

const CONFIDENCE_SCORE: Record<LessonRecordSelfConfidence, number> = {
  CONFIDENT: 1,
  TENTATIVE: 0,
  INSECURE: -1,
};

/** Persistenz: SEEKS_HELP zählt positiv (Hatties Help-seeking-Faktor). */
const PERSISTENCE_SCORE: Record<LessonRecordPersistence, number> = {
  PERSISTS: 1,
  SEEKS_HELP: 1,
  GIVES_UP: 0,
};

/* ────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────── */

/** Records sortiert ASC nach `recordedAt`. */
const sortedAsc = (records: StudentLessonRecordItem[]) =>
  [...records].sort((a, b) => {
    if (a.recordedAt !== b.recordedAt)
      return a.recordedAt.localeCompare(b.recordedAt);
    return a.id.localeCompare(b.id);
  });

const last = <T>(arr: T[], n: number): T[] => arr.slice(Math.max(0, arr.length - n));

const countWhere = <T>(arr: T[], pred: (t: T) => boolean): number =>
  arr.reduce((acc, x) => acc + (pred(x) ? 1 : 0), 0);

/* ────────────────────────────────────────────────────────────────────────
 * Phase 1 — Karte 1: Selbstvertrauen-Trend
 * Sparkline-Daten (Confidence-Score gleitend pro Eintrag).
 * ──────────────────────────────────────────────────────────────────────── */

export type ConfidenceTrendPoint = {
  recordedAt: string;
  score: number;
};

export type ConfidenceTrend = {
  hasData: boolean;
  points: ConfidenceTrendPoint[];
  /** Letzter Score (für Sparkline-Label). */
  latest: number | null;
  /** Durchschnittlicher Score über das Sparkline-Fenster. */
  average: number | null;
};

export function deriveConfidenceTrend(
  records: StudentLessonRecordItem[],
): ConfidenceTrend {
  const withConf = sortedAsc(records).filter(
    (r) => r.selfConfidence != null,
  );
  const window = last(withConf, OBSERVATION_METRICS_THRESHOLDS.sparklineWindow);
  if (window.length === 0)
    return { hasData: false, points: [], latest: null, average: null };

  const points: ConfidenceTrendPoint[] = window.map((r) => ({
    recordedAt: r.recordedAt,
    score: CONFIDENCE_SCORE[r.selfConfidence as LessonRecordSelfConfidence],
  }));
  const sum = points.reduce((acc, p) => acc + p.score, 0);
  return {
    hasData: true,
    points,
    latest: points[points.length - 1]?.score ?? null,
    average: points.length ? sum / points.length : null,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Phase 1 — Karte 2: Konzentrations-Mix
 * Donut: Anteil FLOW / PARTIAL_FOCUS / INTERRUPTED.
 * ──────────────────────────────────────────────────────────────────────── */

export type ConcentrationMix = {
  hasData: boolean;
  total: number;
  counts: Record<LessonRecordConcentration, number>;
  /** Anteil FLOW als Prozent — fürs Center-Label. */
  flowPercent: number;
};

export function deriveConcentrationMix(
  records: StudentLessonRecordItem[],
): ConcentrationMix {
  const counts: Record<LessonRecordConcentration, number> = {
    FLOW: 0,
    PARTIAL_FOCUS: 0,
    INTERRUPTED: 0,
  };
  for (const r of records) {
    if (r.concentration) counts[r.concentration] += 1;
  }
  const total = counts.FLOW + counts.PARTIAL_FOCUS + counts.INTERRUPTED;
  return {
    hasData: total > 0,
    total,
    counts,
    flowPercent: total > 0 ? Math.round((counts.FLOW / total) * 100) : 0,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Phase 1 — Karte 3: Umgang mit Schwierigkeit über Zeit
 * Stacked Bar pro Kalenderwoche (oder pro Record-Block) mit Anteilen
 * PERSISTS / SEEKS_HELP / GIVES_UP.
 * Wir aggregieren pro ISO-Woche (lokal eindeutig), Limit auf letzte 12 Wochen.
 * ──────────────────────────────────────────────────────────────────────── */

export type PersistenceBucket = {
  /** Lesbares Label, z.B. "KW 17" oder ISO-Datum. */
  label: string;
  weekStart: string;
  persists: number;
  seeksHelp: number;
  givesUp: number;
};

export type PersistenceOverTime = {
  hasData: boolean;
  buckets: PersistenceBucket[];
};

const isoWeekStart = (isoDate: string): { weekStart: string; label: string } => {
  // Montag der Woche von isoDate (UTC-basiert), label "KW NN".
  const d = new Date(isoDate + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=So .. 6=Sa
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  const weekStart = d.toISOString().slice(0, 10);
  // ISO week number
  const target = new Date(d);
  target.setUTCDate(target.getUTCDate() + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * 86_400_000),
    );
  return { weekStart, label: `KW ${String(week).padStart(2, "0")}` };
};

export function derivePersistenceOverTime(
  records: StudentLessonRecordItem[],
): PersistenceOverTime {
  const buckets = new Map<string, PersistenceBucket>();
  for (const r of records) {
    if (!r.persistence) continue;
    const { weekStart, label } = isoWeekStart(r.recordedAt);
    let bucket = buckets.get(weekStart);
    if (!bucket) {
      bucket = {
        label,
        weekStart,
        persists: 0,
        seeksHelp: 0,
        givesUp: 0,
      };
      buckets.set(weekStart, bucket);
    }
    if (r.persistence === "PERSISTS") bucket.persists += 1;
    else if (r.persistence === "SEEKS_HELP") bucket.seeksHelp += 1;
    else if (r.persistence === "GIVES_UP") bucket.givesUp += 1;
  }
  const ordered = Array.from(buckets.values()).sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart),
  );
  // Letzte 12 Wochen.
  const tail = last(ordered, 12);
  return { hasData: tail.length > 0, buckets: tail };
}

/* ────────────────────────────────────────────────────────────────────────
 * Phase 1 — Karte 4: ZPD-Sweet-Spot
 * Gauge mit Anteil `JUST_RIGHT` in den letzten N Records.
 * ──────────────────────────────────────────────────────────────────────── */

export type ZpdGauge = {
  hasData: boolean;
  total: number;
  tooEasy: number;
  justRight: number;
  tooHard: number;
  /** Anteil JUST_RIGHT als Prozent. */
  sweetSpotPercent: number;
};

export function deriveZpdGauge(records: StudentLessonRecordItem[]): ZpdGauge {
  const recent = last(
    sortedAsc(records).filter((r) => r.difficulty != null),
    30,
  );
  if (recent.length === 0)
    return {
      hasData: false,
      total: 0,
      tooEasy: 0,
      justRight: 0,
      tooHard: 0,
      sweetSpotPercent: 0,
    };
  const tooEasy = countWhere(recent, (r) => r.difficulty === "TOO_EASY");
  const justRight = countWhere(recent, (r) => r.difficulty === "JUST_RIGHT");
  const tooHard = countWhere(recent, (r) => r.difficulty === "TOO_HARD");
  return {
    hasData: true,
    total: recent.length,
    tooEasy,
    justRight,
    tooHard,
    sweetSpotPercent: Math.round((justRight / recent.length) * 100),
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Phase 1 — Karte 5: Engagement-Score-Sparkline
 * ──────────────────────────────────────────────────────────────────────── */

export type EngagementTrendPoint = {
  recordedAt: string;
  score: number;
};

export type EngagementTrend = {
  hasData: boolean;
  points: EngagementTrendPoint[];
  latest: number | null;
  average: number | null;
};

export function deriveEngagementTrend(
  records: StudentLessonRecordItem[],
): EngagementTrend {
  const withEng = sortedAsc(records).filter((r) => r.engagement != null);
  const window = last(withEng, OBSERVATION_METRICS_THRESHOLDS.sparklineWindow);
  if (window.length === 0)
    return { hasData: false, points: [], latest: null, average: null };
  const points: EngagementTrendPoint[] = window.map((r) => ({
    recordedAt: r.recordedAt,
    score: ENGAGEMENT_SCORE[r.engagement as LessonRecordEngagement],
  }));
  const sum = points.reduce((acc, p) => acc + p.score, 0);
  return {
    hasData: true,
    points,
    latest: points[points.length - 1]?.score ?? null,
    average: points.length ? sum / points.length : null,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Phase 3.B — Visible-Learner-Radar (5 Achsen, 0–100 %)
 * ──────────────────────────────────────────────────────────────────────── */

export type VisibleLearnerRadar = {
  /** Anzahl Records mit mind. einer Observation-Achse — die Datenbasis. */
  observationRecords: number;
  /** Reicht für eine valide Aussage? Schwelle `radarMinRecords`. */
  hasEnoughData: boolean;
  axes: Array<{
    key:
      | "ENGAGEMENT"
      | "SELF_CONFIDENCE"
      | "PERSISTENCE"
      | "FLOW"
      | "ZPD";
    /** 0–100 — Anteil "positiver" Ausprägungen unter den Records, die diese Achse haben. */
    value: number;
    /** Wie viele Records zu dieser Achse beigetragen haben (Tooltip-Kontext). */
    sample: number;
  }>;
};

export function deriveVisibleLearnerRadar(
  records: StudentLessonRecordItem[],
): VisibleLearnerRadar {
  const observationRecords = countWhere(
    records,
    (r) =>
      r.engagement != null ||
      r.difficulty != null ||
      r.selfConfidence != null ||
      r.persistence != null ||
      r.concentration != null,
  );
  const hasEnoughData =
    observationRecords >= OBSERVATION_METRICS_THRESHOLDS.radarMinRecords;

  const pct = (positives: number, sample: number) =>
    sample > 0 ? Math.round((positives / sample) * 100) : 0;

  const engagementSample = records.filter((r) => r.engagement != null);
  const engagementPositive = countWhere(
    engagementSample,
    (r) => r.engagement === "FOCUSED" || r.engagement === "INTERESTED",
  );

  const confidenceSample = records.filter((r) => r.selfConfidence != null);
  const confidencePositive = countWhere(
    confidenceSample,
    (r) => r.selfConfidence === "CONFIDENT",
  );

  const persistenceSample = records.filter((r) => r.persistence != null);
  const persistencePositive = countWhere(
    persistenceSample,
    (r) => r.persistence === "PERSISTS" || r.persistence === "SEEKS_HELP",
  );

  const concentrationSample = records.filter((r) => r.concentration != null);
  const flowPositive = countWhere(
    concentrationSample,
    (r) => r.concentration === "FLOW",
  );

  const difficultySample = records.filter((r) => r.difficulty != null);
  const zpdPositive = countWhere(
    difficultySample,
    (r) => r.difficulty === "JUST_RIGHT",
  );

  return {
    observationRecords,
    hasEnoughData,
    axes: [
      {
        key: "ENGAGEMENT",
        value: pct(engagementPositive, engagementSample.length),
        sample: engagementSample.length,
      },
      {
        key: "SELF_CONFIDENCE",
        value: pct(confidencePositive, confidenceSample.length),
        sample: confidenceSample.length,
      },
      {
        key: "PERSISTENCE",
        value: pct(persistencePositive, persistenceSample.length),
        sample: persistenceSample.length,
      },
      {
        key: "FLOW",
        value: pct(flowPositive, concentrationSample.length),
        sample: concentrationSample.length,
      },
      {
        key: "ZPD",
        value: pct(zpdPositive, difficultySample.length),
        sample: difficultySample.length,
      },
    ],
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Phase 3.E — Self-Assessment-Kalibrierung
 * Vergleich Kind-Selbsteinschätzung vs. nachfolgender Status.
 *   - UNDERSTOOD + nachfolgend NEEDS_MORE  → Überschätzung
 *   - NEEDS_REPEAT + nachfolgend MASTERED → Unterschätzung
 *   - ansonsten kalibriert
 * Wir vergleichen jedes Self-Assessment-Record gegen den nächsten Status-
 * Record derselben Lektion innerhalb von 60 Tagen.
 * ──────────────────────────────────────────────────────────────────────── */

export type SelfAssessmentCalibration = {
  /** Wie viele Self-Tap-Records des Kindes berücksichtigt wurden. */
  evaluated: number;
  /** Reicht für eine Aussage? Schwelle `calibrationMinSelfAssessments`. */
  hasEnoughData: boolean;
  /** Übereinstimmend (Self-Tap stimmt mit späterem Status überein). */
  calibrated: number;
  /** Überschätzung (UNDERSTOOD, danach NEEDS_MORE). */
  overestimated: number;
  /** Unterschätzung (NEEDS_REPEAT, danach MASTERED). */
  underestimated: number;
  /** 0–100, Kalibrierungs-Score (calibrated / evaluated). */
  calibrationPercent: number;
};

export function deriveSelfAssessmentCalibration(
  records: StudentLessonRecordItem[],
): SelfAssessmentCalibration {
  const sorted = sortedAsc(records);
  const recordsByLesson = new Map<string, StudentLessonRecordItem[]>();
  for (const r of sorted) {
    const list = recordsByLesson.get(r.lessonId) ?? [];
    list.push(r);
    recordsByLesson.set(r.lessonId, list);
  }

  let evaluated = 0;
  let calibrated = 0;
  let overestimated = 0;
  let underestimated = 0;
  const SIXTY_DAYS_MS = 60 * 86_400_000;

  for (const list of recordsByLesson.values()) {
    for (let i = 0; i < list.length; i++) {
      const cur = list[i];
      if (!cur.selfAssessmentByChild || cur.selfAssessment == null) continue;

      // Suche Folge-Record derselben Lektion ≤ 60 Tage später mit Status-Update.
      const curTs = new Date(cur.recordedAt + "T00:00:00Z").getTime();
      const followups = list
        .slice(i + 1)
        .filter(
          (n) =>
            new Date(n.recordedAt + "T00:00:00Z").getTime() - curTs <=
            SIXTY_DAYS_MS,
        );
      if (followups.length === 0) continue;

      evaluated += 1;
      const eventualMastered = followups.some(
        (n) => n.status === "MASTERED",
      );
      const eventualNeedsMore = followups.some(
        (n) => n.status === "NEEDS_MORE",
      );

      if (cur.selfAssessment === "UNDERSTOOD" && eventualNeedsMore) {
        overestimated += 1;
      } else if (
        cur.selfAssessment === "NEEDS_REPEAT" &&
        eventualMastered
      ) {
        underestimated += 1;
      } else {
        calibrated += 1;
      }
    }
  }

  return {
    evaluated,
    hasEnoughData:
      evaluated >= OBSERVATION_METRICS_THRESHOLDS.calibrationMinSelfAssessments,
    calibrated,
    overestimated,
    underestimated,
    calibrationPercent:
      evaluated > 0 ? Math.round((calibrated / evaluated) * 100) : 0,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Phase 2.D — Per-Kind-Notizen-Timeline
 * Filtert auf Records mit nicht-leerer Notiz, sortiert DESC.
 * ──────────────────────────────────────────────────────────────────────── */

export type NoteTimelineItem = {
  id: string;
  recordedAt: string;
  note: string;
  status: LessonRecordStatus;
  lessonId: string;
  lessonName: string | null;
  recordedBy: { firstName?: string; lastName?: string } | null;
};

export function deriveNoteTimeline(
  records: StudentLessonRecordItem[],
  locale: string,
): NoteTimelineItem[] {
  const normalizedLocale = locale.toUpperCase();
  return records
    .filter((r) => r.note && r.note.trim().length > 0)
    .sort((a, b) => {
      if (a.recordedAt !== b.recordedAt)
        return b.recordedAt.localeCompare(a.recordedAt);
      return b.id.localeCompare(a.id);
    })
    .map((r) => {
      const lessonName = r.lesson
        ? r.lesson.translations.find(
            (t) => t.locale.toUpperCase() === normalizedLocale,
          )?.name ??
          r.lesson.translations[0]?.name ??
          null
        : null;
      return {
        id: r.id,
        recordedAt: r.recordedAt,
        note: r.note!.trim(),
        status: r.status,
        lessonId: r.lessonId,
        lessonName,
        recordedBy: r.recordedBy ?? null,
      };
    });
}
