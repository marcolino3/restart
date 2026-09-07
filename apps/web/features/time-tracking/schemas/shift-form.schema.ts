import { z } from "zod";

export const TIME_HH_MM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

type Translate = (key: string) => string;

/**
 * Shift definition. Times are wall-clock `HH:MM`; a shift may cross midnight
 * (end < start), only start === end is rejected (zero-length shift).
 */
export const createShiftFormSchema = (t: Translate) =>
  z
    .object({
      name: z.string().trim().min(1).max(120),
      startTime: z.string().regex(TIME_HH_MM_RE, t("shiftTimeInvalid")),
      endTime: z.string().regex(TIME_HH_MM_RE, t("shiftTimeInvalid")),
      color: z
        .string()
        .regex(HEX_COLOR_RE)
        .nullable()
        .optional()
        .transform((v) => v ?? null),
    })
    .refine((v) => v.startTime !== v.endTime, {
      message: t("shiftZeroLength"),
      path: ["endTime"],
    });

export type ShiftFormInput = z.input<ReturnType<typeof createShiftFormSchema>>;
export type ShiftFormOutput = z.output<
  ReturnType<typeof createShiftFormSchema>
>;

/** Minutes between start and end, wrapping past midnight. */
export const shiftDurationMinutes = (start: string, end: string): number => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return e >= s ? e - s : 24 * 60 - s + e;
};
