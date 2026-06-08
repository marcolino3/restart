import { z } from "zod";

export const TeamFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  // Optional parent team for nesting. null / omitted = root-level team.
  parentId: z.string().uuid().nullable().optional(),
});

export type TeamFormType = z.infer<typeof TeamFormSchema>;
