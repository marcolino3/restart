import { z } from "zod";

export const TaskFormSchema = z.object({
  title: z.string().min(1).max(280),
  description: z.string().max(8000).optional().nullable(),
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.date().optional().nullable(),
  assigneeMembershipIds: z.array(z.string()).optional(),
});

export type TaskFormValues = z.input<typeof TaskFormSchema>;
export type TaskFormOutput = z.output<typeof TaskFormSchema>;
