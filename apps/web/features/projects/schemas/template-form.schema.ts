import { z } from "zod";

export const TemplateTaskSchema = z.object({
  title: z.string().min(1).max(280),
  description: z.string().max(8000).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  // Days after the project start date; empty = no due date.
  dueOffsetDays: z.number().int().nullable().optional(),
});

export const TemplateFormSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(4000).optional().nullable(),
  tasks: z.array(TemplateTaskSchema),
});

export type TemplateFormValues = z.input<typeof TemplateFormSchema>;
export type TemplateFormOutput = z.output<typeof TemplateFormSchema>;
