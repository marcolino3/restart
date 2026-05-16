import { z } from "zod";

const slugRegex = /^[a-z0-9_-]+$/;

export const CurriculumFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Required")
    .max(64)
    .regex(slugRegex, "lowercase letters, digits, - or _"),
  nameDe: z.string().min(1, "Required").max(200),
  nameEn: z.string().max(200).optional().or(z.literal("")),
  nameFr: z.string().max(200).optional().or(z.literal("")),
  nameIt: z.string().max(200).optional().or(z.literal("")),
  descriptionDe: z.string().max(2000).optional().or(z.literal("")),
});

export type CurriculumFormValues = z.infer<typeof CurriculumFormSchema>;
