import { z } from "zod";

export const StudentFormSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.date().nullable().optional(),
  gender: z.string().optional().default(""),
  enrollmentDate: z.date().nullable().optional(),
  exitDate: z.date().nullable().optional(),
  notes: z.string().optional().default(""),
});

export type StudentFormType = z.input<typeof StudentFormSchema>;
export type StudentFormOutput = z.output<typeof StudentFormSchema>;
