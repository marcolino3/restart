import { z } from "zod";

/** One teacher assignment as edited in the class form. */
export const SchoolClassTeacherAssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.enum(["LEAD", "ASSISTANT"]).default("LEAD"),
  /** Share of a full teaching load. Empty means "not tracked". */
  workloadPercent: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .or(z.literal("")),
});

export type SchoolClassTeacherAssignment = z.input<
  typeof SchoolClassTeacherAssignmentSchema
>;

export const UpdateSchoolClassFormSchema = z.object({
  id: z.string().uuid(),
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

export type UpdateSchoolClassFormType = z.input<
  typeof UpdateSchoolClassFormSchema
>;
export type UpdateSchoolClassFormOutput = z.output<
  typeof UpdateSchoolClassFormSchema
>;
