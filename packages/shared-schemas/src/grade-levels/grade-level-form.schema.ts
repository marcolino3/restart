import { z } from "zod";

export const GradeLevelFormSchema = z.object({
  name: z.string().trim().min(1),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color")
    .nullable()
    .optional(),
});

export type GradeLevelFormType = z.infer<typeof GradeLevelFormSchema>;
