import type { CurriculumLocale } from "@/features/curricula/types";

export type LessonRecordStatus =
  | "PLANNING"
  | "INTRODUCED"
  | "PRACTICED"
  | "MASTERED"
  | "NEEDS_MORE";

export const LESSON_RECORD_STATUSES: LessonRecordStatus[] = [
  "PLANNING",
  "INTRODUCED",
  "PRACTICED",
  "MASTERED",
  "NEEDS_MORE",
];

export type LessonType = "P" | "THREE_PL" | "E" | "M" | "S";
export type LessonScale = "MASTERABLE" | "ONGOING";

export type LessonTranslationDTO = {
  locale: CurriculumLocale;
  name: string;
};

export type CurriculumNodeType = "AREA" | "TOPIC" | "GROUP" | "LESSON";

export type LessonAncestor = {
  id: string;
  nodeType: CurriculumNodeType;
  position?: number;
  translations: LessonTranslationDTO[];
};

export type LessonOption = {
  id: string;
  position: number;
  lessonType?: LessonType | null;
  lessonScale?: LessonScale | null;
  translations: LessonTranslationDTO[];
  /** Parent chain from immediate parent up to root (e.g. [GROUP, TOPIC, AREA]). */
  ancestors?: LessonAncestor[];
};

export type ClassroomStudentDTO = {
  enrollmentId: string;
  studentId: string;
  firstName: string;
  lastName: string;
};

export type LessonRecordDTO = {
  id: string;
  studentId: string;
  lessonId: string;
  recordedAt: string;
  status: LessonRecordStatus;
  note?: string | null;
};

/* ────────────────────────────────────────────────────────────────────────
 * Hattie observation badges (siehe project_hattie_observations memory).
 * Alle Achsen optional; null = explizit zurückgesetzt, undefined = unverändert.
 * ──────────────────────────────────────────────────────────────────────── */

export type LessonRecordEngagement =
  | "FOCUSED"
  | "INTERESTED"
  | "MECHANICAL"
  | "RESISTANT";

export const LESSON_RECORD_ENGAGEMENTS: LessonRecordEngagement[] = [
  "FOCUSED",
  "INTERESTED",
  "MECHANICAL",
  "RESISTANT",
];

export type LessonRecordDifficulty = "TOO_EASY" | "JUST_RIGHT" | "TOO_HARD";

export const LESSON_RECORD_DIFFICULTIES: LessonRecordDifficulty[] = [
  "TOO_EASY",
  "JUST_RIGHT",
  "TOO_HARD",
];

export type LessonRecordSocialForm =
  | "ALONE"
  | "WITH_PARTNER"
  | "SMALL_GROUP"
  | "WITH_GUIDE";

export const LESSON_RECORD_SOCIAL_FORMS: LessonRecordSocialForm[] = [
  "ALONE",
  "WITH_PARTNER",
  "SMALL_GROUP",
  "WITH_GUIDE",
];

export type LessonRecordSelfAssessment =
  | "UNDERSTOOD"
  | "PARTIAL"
  | "NEEDS_REPEAT";

export const LESSON_RECORD_SELF_ASSESSMENTS: LessonRecordSelfAssessment[] = [
  "UNDERSTOOD",
  "PARTIAL",
  "NEEDS_REPEAT",
];

// LK-Selbstbeobachtung (per Lesson-Record).
export type TeacherPreparation = "WELL_PREPARED" | "ACCEPTABLE" | "RUSHED";
export const TEACHER_PREPARATIONS: TeacherPreparation[] = [
  "WELL_PREPARED",
  "ACCEPTABLE",
  "RUSHED",
];

export type RoomMood = "CALM" | "FOCUSED" | "RESTLESS" | "DIFFICULT";
export const ROOM_MOODS: RoomMood[] = [
  "CALM",
  "FOCUSED",
  "RESTLESS",
  "DIFFICULT",
];

export type TeacherStressLevel = "RELAXED" | "NORMAL" | "STRESSED";
export const TEACHER_STRESS_LEVELS: TeacherStressLevel[] = [
  "RELAXED",
  "NORMAL",
  "STRESSED",
];

// Hattie: Self-efficacy (d ≈ 0.92).
export type LessonRecordSelfConfidence =
  | "CONFIDENT"
  | "TENTATIVE"
  | "INSECURE";
export const LESSON_RECORD_SELF_CONFIDENCES: LessonRecordSelfConfidence[] = [
  "CONFIDENT",
  "TENTATIVE",
  "INSECURE",
];

// Hattie: Persistence/Effort (d ≈ 0.54) + Help-seeking (d ≈ 0.72).
export type LessonRecordPersistence =
  | "PERSISTS"
  | "SEEKS_HELP"
  | "GIVES_UP";
export const LESSON_RECORD_PERSISTENCES: LessonRecordPersistence[] = [
  "PERSISTS",
  "SEEKS_HELP",
  "GIVES_UP",
];

// Montessori: Normalisation / Polarisation der Aufmerksamkeit.
export type LessonRecordConcentration =
  | "FLOW"
  | "PARTIAL_FOCUS"
  | "INTERRUPTED";
export const LESSON_RECORD_CONCENTRATIONS: LessonRecordConcentration[] = [
  "FLOW",
  "PARTIAL_FOCUS",
  "INTERRUPTED",
];

export type LessonRecordObservation = {
  engagement?: LessonRecordEngagement | null;
  difficulty?: LessonRecordDifficulty | null;
  socialForm?: LessonRecordSocialForm | null;
  selfAssessment?: LessonRecordSelfAssessment | null;
  selfAssessmentByChild?: boolean;
  lessonClarityConfirmed?: boolean | null;
  teacherPreparation?: TeacherPreparation | null;
  roomMood?: RoomMood | null;
  teacherStressLevel?: TeacherStressLevel | null;
  selfConfidence?: LessonRecordSelfConfidence | null;
  persistence?: LessonRecordPersistence | null;
  concentration?: LessonRecordConcentration | null;
};

export const EMPTY_OBSERVATION: LessonRecordObservation = {
  engagement: null,
  difficulty: null,
  socialForm: null,
  selfAssessment: null,
  selfAssessmentByChild: false,
  lessonClarityConfirmed: null,
  teacherPreparation: null,
  roomMood: null,
  teacherStressLevel: null,
  selfConfidence: null,
  persistence: null,
  concentration: null,
};

export const isObservationEmpty = (o: LessonRecordObservation): boolean =>
  !o.engagement &&
  !o.difficulty &&
  !o.socialForm &&
  !o.selfAssessment &&
  !o.selfAssessmentByChild &&
  o.lessonClarityConfirmed == null &&
  !o.teacherPreparation &&
  !o.roomMood &&
  !o.teacherStressLevel &&
  !o.selfConfidence &&
  !o.persistence &&
  !o.concentration;
