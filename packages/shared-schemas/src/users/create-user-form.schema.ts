import { z } from "zod";

export const PERSONA_VALUES = [
  "ADMIN",
  "HR",
  "OFFICE",
  "TEACHER",
  "PARENT",
  "STUDENT",
  "EMPLOYEE",
] as const;

export const CreateUserFormSchema = z.object({
  firstName: z.string().min(1).default(""),
  lastName: z.string().min(1).default(""),
  email: z.string().email().default(""),
  password: z.string().optional().default(""),
  title: z.string().optional().default(""),
  organizationId: z.string().uuid(),
  persona: z.enum(PERSONA_VALUES),
  roleIds: z.array(z.string().uuid()).min(1),
});

export type CreateUserFormType = z.input<typeof CreateUserFormSchema>;
export type CreateUserFormOutput = z.output<typeof CreateUserFormSchema>;
