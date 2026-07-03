import { z } from "zod";

export const UpdateSchoolClassFormSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  gradeLevelIds: z.array(z.string()).optional().default([]),
  teacherIds: z.array(z.string()).optional().default([]),
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
