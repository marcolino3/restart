import { z } from "zod";

export const HolidayFormSchema = z.object({
  date: z.date(),
  name: z.string().min(1),
  paidPercentage: z.coerce.number().int().min(0).max(100).default(100),
  repeatsYearly: z.boolean().default(false),
});
export type HolidayFormInput = z.input<typeof HolidayFormSchema>;
export type HolidayFormOutput = z.output<typeof HolidayFormSchema>;

type Translate = (key: string) => string;

export const createCompanyVacationFormSchema = (t: Translate) =>
  z
    .object({
      name: z.string().min(1),
      startDate: z.date(),
      endDate: z.date(),
    })
    .refine((v) => v.endDate >= v.startDate, {
      message: t("endBeforeStart"),
      path: ["endDate"],
    });

export type CompanyVacationFormInput = z.input<
  ReturnType<typeof createCompanyVacationFormSchema>
>;
export type CompanyVacationFormOutput = z.output<
  ReturnType<typeof createCompanyVacationFormSchema>
>;

export const EmployeeVacationAccrualTypeValues = [
  "CHARGED",
  "PAID_NO_CHARGE",
  "UNPAID",
] as const;

export const createEmployeeVacationFormSchema = (t: Translate) =>
  z
    .object({
      name: z.string().optional(),
      startDate: z.date(),
      endDate: z.date(),
      accrualType: z
        .enum(EmployeeVacationAccrualTypeValues)
        .default("CHARGED"),
      remark: z.string().optional(),
    })
    .refine((v) => v.endDate >= v.startDate, {
      message: t("endBeforeStart"),
      path: ["endDate"],
    });

export type EmployeeVacationFormInput = z.input<
  ReturnType<typeof createEmployeeVacationFormSchema>
>;
export type EmployeeVacationFormOutput = z.output<
  ReturnType<typeof createEmployeeVacationFormSchema>
>;
