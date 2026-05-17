import { z } from "zod";
import { LESSON_RECORD_STATUSES } from "../types";

/**
 * recordedAt: akzeptiert sowohl ein Date-Objekt (aus DatePickerFormField)
 * als auch einen ISO-Date-String — die Submit-Handler konvertieren dann
 * konsistent zu YYYY-MM-DD vor der Mutation.
 */
export const lessonRecordsBulkSchema = z.object({
  lessonId: z.string().uuid({ message: "selectLessonFirst" }),
  schoolClassId: z.string().uuid({ message: "selectClassroomFirst" }),
  studentIds: z
    .array(z.string().uuid())
    .min(1, { message: "selectAtLeastOneStudent" }),
  recordedAt: z.union([
    z.date(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date" }),
  ]),
  status: z.enum(LESSON_RECORD_STATUSES as [string, ...string[]]),
  note: z.string().trim().max(2000).optional().nullable(),
});

export type LessonRecordsBulkFormValues = z.infer<
  typeof lessonRecordsBulkSchema
>;
