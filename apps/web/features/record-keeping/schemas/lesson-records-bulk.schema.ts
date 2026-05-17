import { z } from "zod";
import {
  LESSON_RECORD_DIFFICULTIES,
  LESSON_RECORD_ENGAGEMENTS,
  LESSON_RECORD_SELF_ASSESSMENTS,
  LESSON_RECORD_SOCIAL_FORMS,
  LESSON_RECORD_STATUSES,
  ROOM_MOODS,
  TEACHER_PREPARATIONS,
  TEACHER_STRESS_LEVELS,
} from "../types";

export const observationSchema = z.object({
  engagement: z
    .enum(LESSON_RECORD_ENGAGEMENTS as [string, ...string[]])
    .nullable()
    .optional(),
  difficulty: z
    .enum(LESSON_RECORD_DIFFICULTIES as [string, ...string[]])
    .nullable()
    .optional(),
  socialForm: z
    .enum(LESSON_RECORD_SOCIAL_FORMS as [string, ...string[]])
    .nullable()
    .optional(),
  selfAssessment: z
    .enum(LESSON_RECORD_SELF_ASSESSMENTS as [string, ...string[]])
    .nullable()
    .optional(),
  selfAssessmentByChild: z.boolean().optional(),
  lessonClarityConfirmed: z.boolean().nullable().optional(),
  teacherPreparation: z
    .enum(TEACHER_PREPARATIONS as [string, ...string[]])
    .nullable()
    .optional(),
  roomMood: z
    .enum(ROOM_MOODS as [string, ...string[]])
    .nullable()
    .optional(),
  teacherStressLevel: z
    .enum(TEACHER_STRESS_LEVELS as [string, ...string[]])
    .nullable()
    .optional(),
});

/**
 * recordedAt: akzeptiert sowohl ein Date-Objekt (aus DatePickerFormField)
 * als auch einen ISO-Date-String — die Submit-Handler konvertieren dann
 * konsistent zu YYYY-MM-DD vor der Mutation.
 *
 * observation = Bulk-Default. perChildObservations = optionale Overrides
 * (Map studentId → Sub-Observation) für die Akkordeon-UI.
 */
export const lessonRecordsBulkSchema = z.object({
  lessonId: z.string().uuid({ message: "selectLessonFirst" }),
  studentIds: z
    .array(z.string().uuid())
    .min(1, { message: "selectAtLeastOneStudent" }),
  recordedAt: z.union([
    z.date(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date" }),
  ]),
  status: z.enum(LESSON_RECORD_STATUSES as [string, ...string[]]),
  note: z.string().trim().max(2000).optional().nullable(),
  observation: observationSchema.optional(),
  perChildObservations: z.record(z.string().uuid(), observationSchema).optional(),
});

export type LessonRecordsBulkFormValues = z.infer<
  typeof lessonRecordsBulkSchema
>;
