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

export type LessonOption = {
  id: string;
  position: number;
  lessonType?: LessonType | null;
  lessonScale?: LessonScale | null;
  translations: LessonTranslationDTO[];
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
