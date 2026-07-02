import { z } from "zod";
import { SIGNED_DURATION_REGEX } from "../lib/duration-input";

type Translate = (key: string) => string;

/** Paid overtime: hours + minutes entered separately, stored as minutes. */
export const createPaidOvertimeFormSchema = (t: Translate) =>
  z
    .object({
      date: z.date(),
      hours: z.coerce.number().int().min(0).default(0),
      minutes: z.coerce.number().int().min(0).max(59).default(0),
      note: z.string().optional().default(""),
    })
    .refine((v) => v.hours * 60 + v.minutes > 0, {
      message: t("durationRequired"),
      path: ["minutes"],
    });

export type PaidOvertimeFormInput = z.input<
  ReturnType<typeof createPaidOvertimeFormSchema>
>;
export type PaidOvertimeFormOutput = z.output<
  ReturnType<typeof createPaidOvertimeFormSchema>
>;

/** Opening balance: signed "H:MM" work time + decimal vacation days. */
export const createOpeningBalanceFormSchema = (t: Translate) =>
  z.object({
    periodId: z.string().min(1, { message: t("selectPeriod") }),
    openingWorkTime: z
      .string()
      .trim()
      .regex(SIGNED_DURATION_REGEX, { message: t("invalidSignedTime") }),
    openingVacationDays: z.coerce
      .number()
      .multipleOf(0.5, { message: t("halfDaysOnly") })
      .min(-365)
      .max(365),
  });

export type OpeningBalanceFormInput = z.input<
  ReturnType<typeof createOpeningBalanceFormSchema>
>;
export type OpeningBalanceFormOutput = z.output<
  ReturnType<typeof createOpeningBalanceFormSchema>
>;
