import { z } from "zod";

export const CreateSchoolClassFormSchema = z.object({
  name: z.string().min(1),
  gradeLevelIds: z.array(z.string()).optional().default([]),
  teacherIds: z.array(z.string()).optional().default([]),
  color: z.string().optional().default(""),
  description: z.string().optional().default(""),
  sortOrder: z.coerce.number().int().min(0).default(0),
  maxCapacity: z.coerce.number().int().min(1).optional().or(z.literal("")),
  room: z.string().optional().default(""),
});

export type CreateSchoolClassFormType = z.input<
  typeof CreateSchoolClassFormSchema
>;
export type CreateSchoolClassFormOutput = z.output<
  typeof CreateSchoolClassFormSchema
>;
