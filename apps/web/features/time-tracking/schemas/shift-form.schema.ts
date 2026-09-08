import { z } from "zod";

export const TIME_HH_MM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

type Translate = (key: string) => string;

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Minutes between start and end, wrapping past midnight. */
export const shiftDurationMinutes = (start: string, end: string): number => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return e >= s ? e - s : 24 * 60 - s + e;
};

/** Minutes from the shift start to `time`, wrapping past midnight. */
const offsetFromStart = (shiftStart: string, time: string): number => {
  const s = toMinutes(shiftStart);
  const t = toMinutes(time);
  return t >= s ? t - s : 24 * 60 - s + t;
};

export type ShiftBreakValue = { startTime: string; endTime: string };

/** Sum of break minutes. */
export const breakMinutes = (breaks: ShiftBreakValue[]): number =>
  breaks.reduce(
    (sum, b) => sum + shiftDurationMinutes(b.startTime, b.endTime),
    0,
  );

/** Paid minutes: shift length minus breaks. */
export const shiftNetMinutes = (
  start: string,
  end: string,
  breaks: ShiftBreakValue[],
): number => shiftDurationMinutes(start, end) - breakMinutes(breaks);

/**
 * Shift definition. Times are wall-clock `HH:MM`; a shift may cross midnight
 * (end < start), only start === end is rejected (zero-length shift). Breaks
 * must lie inside the shift and must not overlap.
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
      breaks: z
        .array(
          z.object({
            startTime: z.string().regex(TIME_HH_MM_RE, t("shiftTimeInvalid")),
            endTime: z.string().regex(TIME_HH_MM_RE, t("shiftTimeInvalid")),
          }),
        )
        .max(10)
        .optional()
        .transform((v) => v ?? []),
    })
    .refine((v) => v.startTime !== v.endTime, {
      message: t("shiftZeroLength"),
      path: ["endTime"],
    })
    .superRefine((v, ctx) => {
      if (v.startTime === v.endTime) return;
      const length = shiftDurationMinutes(v.startTime, v.endTime);
      const positioned = v.breaks.map((b, index) => {
        const from = offsetFromStart(v.startTime, b.startTime);
        const to = offsetFromStart(v.startTime, b.endTime);
        if (to <= from) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("shiftBreakZeroLength"),
            path: ["breaks", index, "endTime"],
          });
        } else if (to > length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("shiftBreakOutsideShift"),
            path: ["breaks", index, "endTime"],
          });
        }
        return { index, from, to };
      });
      const sorted = [...positioned].sort((a, b) => a.from - b.from);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].from < sorted[i - 1].to) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("shiftBreaksOverlap"),
            path: ["breaks", sorted[i].index, "startTime"],
          });
        }
      }
    });

export type ShiftFormInput = z.input<ReturnType<typeof createShiftFormSchema>>;
export type ShiftFormOutput = z.output<
  ReturnType<typeof createShiftFormSchema>
>;
