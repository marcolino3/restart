import { z } from "zod";
import { SchoolClassTeacherAssignmentSchema } from "./update-school-class-form.schema";

export const CreateSchoolClassFormSchema = z.object({
  name: z.string().min(1),
  shortCode: z.string().max(16).optional().default(""),
  gradeLevelIds: z.array(z.string()).optional().default([]),
  teacherIds: z.array(z.string()).optional().default([]),
  teachers: z
    .array(SchoolClassTeacherAssignmentSchema)
    .optional()
    .default([]),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color")
    .nullable()
    .optional(),
  description: z.string().optional().default(""),
  maxCapacity: z.coerce.number().int().min(1).optional().or(z.literal("")),
  room: z.string().optional().default(""),
});

export type CreateSchoolClassFormType = z.input<
  typeof CreateSchoolClassFormSchema
>;
export type CreateSchoolClassFormOutput = z.output<
  typeof CreateSchoolClassFormSchema
>;
