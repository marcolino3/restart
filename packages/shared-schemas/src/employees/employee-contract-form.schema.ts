import { z } from "zod";

export const EmployeeContractTypeEnum = z.enum([
  "PERMANENT",
  "TEMPORARY",
  "HOURLY",
  "INTERNSHIP",
  "APPRENTICESHIP",
]);

export const EmployeePaymentIntervalEnum = z.enum([
  "MONTHLY_X12",
  "MONTHLY_X13",
]);

const numericOrNull = z
  .preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().nullable(),
  )
  .optional();

const intPercentOrNull = z
  .preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0).max(100).nullable(),
  )
  .optional();

const intOrNull = z
  .preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).nullable(),
  )
  .optional();

export const EmployeeContractFormSchema = z.object({
  id: z.string().uuid().optional(),
  employeeId: z.string().uuid(),
  startDate: z.date({ message: "Startdatum ist erforderlich" }),
  endDate: z.date().nullable().optional(),
  probationEndDate: z.date().nullable().optional(),
  contractType: EmployeeContractTypeEnum.or(z.literal("")).optional(),
  position: z.string().optional().default(""),
  supervisorMembershipId: z.string().uuid().nullable().optional(),
  workloadPercent: intPercentOrNull,
  weeklyHours: z.string().optional().default(""),
  grossSalary: numericOrNull,
  paymentInterval: EmployeePaymentIntervalEnum.or(z.literal("")).optional(),
  has13thSalary: z.boolean().nullable().optional(),
  annualVacationDays: intOrNull,
  remainingVacationDays: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  documentUrl: z.string().optional().default(""),
});

export type EmployeeContractFormType = z.input<
  typeof EmployeeContractFormSchema
>;
export type EmployeeContractFormOutput = z.output<
  typeof EmployeeContractFormSchema
>;
