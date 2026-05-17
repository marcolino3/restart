import { z } from "zod";

export const UpdateSchoolClassFormSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  gradeLevelIds: z.array(z.string()).optional().default([]),
  teacherIds: z.array(z.string()).optional().default([]),
  color: z.string().optional().default(""),
  description: z.string().optional().default(""),
  sortOrder: z.coerce.number().int().min(0).default(0),
  maxCapacity: z.coerce.number().int().min(1).optional().or(z.literal("")),
  room: z.string().optional().default(""),
});

export type UpdateSchoolClassFormType = z.input<
  typeof UpdateSchoolClassFormSchema
>;
export type UpdateSchoolClassFormOutput = z.output<
  typeof UpdateSchoolClassFormSchema
>;
