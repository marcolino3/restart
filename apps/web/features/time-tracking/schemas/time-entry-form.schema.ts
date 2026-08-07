import { z } from "zod";

/** Minuten-im-Tag aus einem von TimeScrollFormField gelieferten "HH:mm"-String. */
export const minutesOfDay = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const MAX_PAST_DAYS = 7;

const isWithinEditableRange = (date: Date): boolean => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const earliest = new Date();
  earliest.setDate(earliest.getDate() - MAX_PAST_DAYS);
  earliest.setHours(0, 0, 0, 0);
  return date <= today && date >= earliest;
};

export const TimeEntryFormSchema = z
  .object({
    date: z.date().refine(isWithinEditableRange, {
      message: "dateOutOfRange",
    }),
    // "HH:mm"-Strings von TimeScrollFormField
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
