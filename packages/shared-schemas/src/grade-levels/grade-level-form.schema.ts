import { z } from "zod";

export const GradeLevelFormSchema = z
  .object({
    name: z.string().trim().min(1),
    shortCode: z
      .string()
      .trim()
      .max(16)
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : (v ?? null))),
    ageMin: z.number().int().min(0).max(30).nullable().optional(),
    ageMax: z.number().int().min(0).max(30).nullable().optional(),
    color: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color")
      .nullable()
      .optional(),
  })
  .refine((v) => v.ageMin == null || v.ageMax == null || v.ageMax >= v.ageMin, {
    message: "ageRangeInvalid",
    path: ["ageMax"],
  });

export type GradeLevelFormType = z.infer<typeof GradeLevelFormSchema>;
export type GradeLevelFormInput = z.input<typeof GradeLevelFormSchema>;
