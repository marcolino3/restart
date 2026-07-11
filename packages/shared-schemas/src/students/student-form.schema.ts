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
  // --- Master data extension (Scope 1) ---
  preferredName: z.string().optional().default(""),
  placeOfBirth: z.string().optional().default(""),
  firstLanguages: z.array(z.string()).optional().default([]),
  familyLanguages: z.array(z.string()).optional().default([]),
  religion: z.string().optional().default(""),
  socialSecurityNumber: z.string().optional().default(""),
  externalStudentId: z.string().optional().default(""),
  /** Nationalities as ISO country codes (e.g. `["CH", "DE"]`). */
  nationalities: z.array(z.string()).optional().default([]),
});

export type StudentFormType = z.input<typeof StudentFormSchema>;
export type StudentFormOutput = z.output<typeof StudentFormSchema>;
