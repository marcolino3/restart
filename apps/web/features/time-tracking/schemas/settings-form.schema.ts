import { z } from "zod";

export const HolidayFormSchema = z.object({
  date: z.date(),
  name: z.string().min(1),
  paidPercentage: z.coerce.number().int().min(0).max(100).default(100),
  canton: z.string().optional().default(""),
});
export type HolidayFormInput = z.input<typeof HolidayFormSchema>;
export type HolidayFormOutput = z.output<typeof HolidayFormSchema>;

export const CompanyVacationFormSchema = z
  .object({
    name: z.string().min(1),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "endBeforeStart",
    path: ["endDate"],
  });
export type CompanyVacationFormInput = z.input<typeof CompanyVacationFormSchema>;
export type CompanyVacationFormOutput = z.output<
  typeof CompanyVacationFormSchema
>;
