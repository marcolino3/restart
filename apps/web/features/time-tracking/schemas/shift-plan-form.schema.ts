import { z } from "zod";

type Translate = (key: string) => string;

export const MAX_SHIFT_PLAN_DAYS = 92;

const dayNumber = (d: Date) =>
  Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

/** Inclusive number of calendar days between two dates. */
export const planDayCount = (start: Date, end: Date): number =>
  dayNumber(end) - dayNumber(start) + 1;

export const createShiftPlanFormSchema = (t: Translate) =>
  z
    .object({
      startDate: z.date(),
      endDate: z.date(),
    })
    .superRefine((v, ctx) => {
      const days = planDayCount(v.startDate, v.endDate);
      if (days < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: t("shiftPlanEndBeforeStart"),
        });
      } else if (days > MAX_SHIFT_PLAN_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: t("shiftPlanTooLong"),
        });
      }
    });

export type ShiftPlanFormInput = z.input<
  ReturnType<typeof createShiftPlanFormSchema>
>;
export type ShiftPlanFormOutput = z.output<
  ReturnType<typeof createShiftPlanFormSchema>
>;
