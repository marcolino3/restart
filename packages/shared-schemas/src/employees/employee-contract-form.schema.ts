import { z } from "zod";
import {
  EMPLOYEE_CONTRACT_TYPES,
  contractTypeRules,
  missingRequiredContractFields,
  type ContractTypeDependentField,
} from "./contract-type-rules";
import {
  WeekdayTimeWindowsSchema,
  WeekdayWorkloadsSchema,
} from "./weekday-schedule.schema";
import { refineEndDateNotBeforeStart } from "./contract-date-rules";

export const EmployeeContractTypeEnum = z.enum(EMPLOYEE_CONTRACT_TYPES);

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

/** Workload in percent — fractions are intentional (e.g. 53.2 % from a plan). */
const percentOrNull = z
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

/** Accepts Date or ISO string (Next.js server actions serialize Date → string). */
const dateRequired = z.preprocess((v) => {
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d;
  }
  return v;
}, z.date({ message: "Startdatum ist erforderlich" }));

const dateNullable = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d;
  }
  return v;
}, z.date().nullable()).optional();

const BaseEmployeeContractFormSchema = z.object({
  id: z.string().uuid().optional(),
  employeeId: z.string().uuid(),
  startDate: dateRequired,
  endDate: dateNullable,
  probationEndDate: dateNullable,
  contractType: EmployeeContractTypeEnum.or(z.literal("")).optional(),
  position: z.string().optional().default(""),
  supervisorMembershipId: z.string().uuid().nullable().optional(),
  workloadPercent: percentOrNull,
  weeklyHours: z.string().optional().default(""),
  grossSalary: numericOrNull,
  hourlyRate: numericOrNull,
  paymentInterval: EmployeePaymentIntervalEnum.or(z.literal("")).optional(),
  has13thSalary: z.boolean().nullable().optional(),
  annualVacationDays: intOrNull,
  remainingVacationDays: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  documentUrl: z.string().optional().default(""),
  weekdayTimeWindows: WeekdayTimeWindowsSchema.optional(),
  weekdayWorkloads: WeekdayWorkloadsSchema.optional(),
});

/**
 * Zod cannot express "required depending on another field" declaratively, so the
 * contract-type matrix is applied as a refinement. The same table is enforced in
 * the backend — see `contract-type-rules.ts`.
 */
export const EmployeeContractFormSchema =
  BaseEmployeeContractFormSchema.superRefine((values, ctx) => {
    refineEndDateNotBeforeStart(values, ctx);
    for (const field of missingRequiredContractFields(
      values,
      values.contractType,
    )) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: "Dieses Feld ist für die gewählte Vertragsart erforderlich",
      });
    }
  });

/**
 * Same schema, but a field the caller cannot write (field-level RBAC hid it
 * in the UI) never counts as "missing" — the form must stay submittable even
 * though the contract type would otherwise require it.
 */
export function buildEmployeeContractFormSchema(
  hiddenByPermission: ReadonlySet<ContractTypeDependentField>,
) {
  if (hiddenByPermission.size === 0) return EmployeeContractFormSchema;

  return BaseEmployeeContractFormSchema.superRefine((values, ctx) => {
    refineEndDateNotBeforeStart(values, ctx);
    for (const field of missingRequiredContractFields(
      values,
      values.contractType,
    )) {
      if (hiddenByPermission.has(field)) continue;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: "Dieses Feld ist für die gewählte Vertragsart erforderlich",
      });
    }
  });
}

/**
 * Clears every field that does not apply to the chosen contract type, so a type
 * switch cannot leave contradicting leftovers (e.g. an hourly rate on a
 * permanent contract).
 */
export function clearHiddenContractFormFields<
  T extends Partial<Record<ContractTypeDependentField, unknown>> & {
    contractType?: string | null;
  },
>(values: T): T {
  const rules = contractTypeRules(values.contractType);
  for (const field of Object.keys(rules) as ContractTypeDependentField[]) {
    if (rules[field] === "hidden") {
      (values as Record<string, unknown>)[field] = null;
    }
  }
  return values;
}

export type EmployeeContractFormType = z.input<
  typeof EmployeeContractFormSchema
>;
export type EmployeeContractFormOutput = z.output<
  typeof EmployeeContractFormSchema
>;
