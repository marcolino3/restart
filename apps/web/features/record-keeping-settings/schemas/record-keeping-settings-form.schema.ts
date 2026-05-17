import { z } from "zod";

export const recordKeepingSettingsFormSchema = z.object({
  introducedStuckDays: z
    .number()
    .int()
    .min(1, "settingsValidationMin")
    .max(3650, "settingsValidationMax"),
  practicedStuckDays: z
    .number()
    .int()
    .min(1, "settingsValidationMin")
    .max(3650, "settingsValidationMax"),
  bigGapDays: z
    .number()
    .int()
    .min(1, "settingsValidationMin")
    .max(3650, "settingsValidationMax"),
});

export type RecordKeepingSettingsFormValues = z.infer<
  typeof recordKeepingSettingsFormSchema
>;
