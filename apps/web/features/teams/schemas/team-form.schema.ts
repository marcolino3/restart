import { z } from "zod";

export const TeamFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export type TeamFormType = z.infer<typeof TeamFormSchema>;
