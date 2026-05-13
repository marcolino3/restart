import { z } from "zod";

export const CreateUserFormSchema = z.object({
  firstName: z.string().min(1).default(""),
  lastName: z.string().min(1).default(""),
  email: z.string().email().default(""),
  password: z.string().optional().default(""),
  title: z.string().optional().default(""),
  organizationId: z.string().uuid(),
  persona: z.string().min(1),
  roleIds: z.array(z.string().uuid()).min(1),
});

export type CreateUserFormType = z.input<typeof CreateUserFormSchema>;
export type CreateUserFormOutput = z.output<typeof CreateUserFormSchema>;
