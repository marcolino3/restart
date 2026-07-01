import { z } from "zod";

/** Minuten-im-Tag aus einem von TimePickerFormField gelieferten ISO-String. */
export const minutesOfDay = (iso: string): number => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

export const TimeEntryFormSchema = z
  .object({
    date: z.date(),
    // ISO-Strings von TimePickerFormField (zeigt/liest HH:mm)
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    breakMinutes: z.coerce.number().int().min(0).max(600).default(0),
    notes: z.string().max(500).optional().default(""),
  })
  .refine((v) => minutesOfDay(v.endTime) > minutesOfDay(v.startTime), {
    message: "endBeforeStart",
    path: ["endTime"],
  });

export type TimeEntryFormOutput = z.output<typeof TimeEntryFormSchema>;
export type TimeEntryFormInput = z.input<typeof TimeEntryFormSchema>;
