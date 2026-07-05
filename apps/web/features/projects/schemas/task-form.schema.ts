import { z } from "zod";

export const TaskChecklistItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(500),
  done: z.boolean(),
});

export const TaskFormSchema = z.object({
  title: z.string().min(1).max(280),
  description: z.string().max(8000).optional().nullable(),
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.date().optional().nullable(),
  // Optional time of day (HH:MM). Empty string = no time.
  dueTime: z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .or(z.literal(""))
    .optional()
    .nullable(),
  checklist: z.array(TaskChecklistItemSchema).optional(),
  assigneeMembershipIds: z.array(z.string()).optional(),
});

export type TaskFormValues = z.input<typeof TaskFormSchema>;
export type TaskFormOutput = z.output<typeof TaskFormSchema>;
