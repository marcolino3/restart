import { z } from "zod";

export const GradeLevelFormSchema = z.object({
  name: z.string().trim().min(1),
});

export type GradeLevelFormType = z.infer<typeof GradeLevelFormSchema>;
