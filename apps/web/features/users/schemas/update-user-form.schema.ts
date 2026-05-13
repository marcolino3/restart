import { z } from "zod";

export const UpdateUserFormSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional().default(""),
  firstName: z.string().min(1).default(""),
  lastName: z.string().min(1).default(""),
  dateOfBirth: z.date().nullable().optional(),
  socialSecurityNumber: z.string().optional().default(""),
});

export type UpdateUserFormType = z.input<typeof UpdateUserFormSchema>;
export type UpdateUserFormOutput = z.output<typeof UpdateUserFormSchema>;
