import { z } from "zod";

export const EmployeeMaritalStatusEnum = z.enum([
  "SINGLE",
  "MARRIED",
  "REGISTERED_PARTNERSHIP",
  "SEPARATED",
  "DIVORCED",
  "WIDOWED",
]);

export const EmployeeResidencePermitTypeEnum = z.enum([
  "CITIZEN",
  "B",
  "C",
  "L",
  "G",
  "F",
  "OTHER",
]);

export const EmployeeOnboardingStatusEnum = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);

const intOrNull = z
  .preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).nullable(),
  )
  .optional();

export const EmployeeHrProfileFormSchema = z.object({
  employeeId: z.string().uuid(),
  iban: z.string().optional().default(""),
  bankAccountHolder: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  bvgProvider: z.string().optional().default(""),
  bvgInsuranceNumber: z.string().optional().default(""),
  uvgProvider: z.string().optional().default(""),
  withholdingTaxCode: z.string().optional().default(""),
  nationality: z.string().optional().default(""),
  residencePermitType: EmployeeResidencePermitTypeEnum.or(z.literal("")).optional(),
  residencePermitValidUntil: z.date().nullable().optional(),
  maritalStatus: EmployeeMaritalStatusEnum.or(z.literal("")).optional(),
  denomination: z.string().optional().default(""),
  numberOfChildren: intOrNull,
  onboardingStatus: EmployeeOnboardingStatusEnum.or(z.literal("")).optional(),
  ndaSigned: z.boolean().nullable().optional(),
  criminalRecordSubmitted: z.boolean().nullable().optional(),
});

export type EmployeeHrProfileFormType = z.input<
  typeof EmployeeHrProfileFormSchema
>;
export type EmployeeHrProfileFormOutput = z.output<
  typeof EmployeeHrProfileFormSchema
>;
