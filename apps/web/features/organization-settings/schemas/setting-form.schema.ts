import { z } from "zod";

export const settingFormSchema = z.object({
  key: z
    .string()
    .min(1, "Key ist erforderlich")
    .max(255, "Key darf maximal 255 Zeichen haben")
    .regex(
      /^[A-Z0-9_]+$/,
      "Key darf nur Großbuchstaben, Zahlen und Unterstriche enthalten"
    ),
  value: z.string().min(1, "Wert ist erforderlich"),
  description: z.string().max(500, "Beschreibung darf maximal 500 Zeichen haben").optional(),
});

export type SettingFormValues = z.infer<typeof settingFormSchema>;

export const updateSettingFormSchema = z.object({
  key: z.string(),
  value: z.string().optional(),
  description: z.string().max(500).optional(),
});

export type UpdateSettingFormValues = z.infer<typeof updateSettingFormSchema>;
