/**
 * Which contract fields apply to which contract type.
 *
 * Mirrored in
 * `apps/backend/src/employee-management/employee-contracts/contract-type-rules.ts`,
 * which enforces the same table server-side. The backend has no dependency on
 * this (ESM/Zod) package, so both tables must be kept in sync by hand.
 */

export const EMPLOYEE_CONTRACT_TYPES = [
  "PERMANENT",
  "TEMPORARY",
  "HOURLY",
  "INTERNSHIP",
  "APPRENTICESHIP",
  "SUBSTITUTE",
  "EXTERNAL",
] as const;

export type EmployeeContractTypeValue = (typeof EMPLOYEE_CONTRACT_TYPES)[number];

/**
 * - `required`: must be filled in, form submission is blocked otherwise
 * - `optional`: shown and may be filled in
 * - `hidden`: not applicable for this type; not rendered and cleared on save
 */
export type ContractFieldMode = "required" | "optional" | "hidden";

export type ContractTypeDependentField =
  | "endDate"
  | "probationEndDate"
  | "grossSalary"
  | "hourlyRate"
  | "paymentInterval"
  | "has13thSalary"
  | "annualVacationDays"
  | "workloadPercent"
  | "weeklyHours";

export type ContractTypeRules = Record<
  ContractTypeDependentField,
  ContractFieldMode
>;

/**
 * Hourly, substitute and freelance staff are paid per hour and settle holidays
 * via a percentage supplement, hence no monthly salary and no vacation days.
 * A workload percentage (and the full-time weekly-hours reference it needs) is
 * meaningless for them as well: they are paid for the hours actually worked,
 * not against a fixed share of a full-time week.
 */
export const CONTRACT_TYPE_RULES: Record<
  EmployeeContractTypeValue,
  ContractTypeRules
> = {
  PERMANENT: {
    endDate: "optional",
    probationEndDate: "optional",
    grossSalary: "required",
    hourlyRate: "hidden",
    paymentInterval: "optional",
    has13thSalary: "optional",
    annualVacationDays: "optional",
    workloadPercent: "optional",
    weeklyHours: "optional",
  },
  TEMPORARY: {
    endDate: "required",
    probationEndDate: "optional",
    grossSalary: "required",
    hourlyRate: "hidden",
    paymentInterval: "optional",
    has13thSalary: "optional",
    annualVacationDays: "optional",
    workloadPercent: "optional",
    weeklyHours: "optional",
  },
  HOURLY: {
    endDate: "optional",
    probationEndDate: "hidden",
    grossSalary: "hidden",
    hourlyRate: "required",
    paymentInterval: "hidden",
    has13thSalary: "hidden",
    annualVacationDays: "hidden",
    workloadPercent: "hidden",
    weeklyHours: "hidden",
  },
  INTERNSHIP: {
    endDate: "required",
    probationEndDate: "hidden",
    grossSalary: "optional",
    hourlyRate: "hidden",
    paymentInterval: "optional",
    has13thSalary: "optional",
    annualVacationDays: "optional",
    workloadPercent: "optional",
    weeklyHours: "optional",
  },
  APPRENTICESHIP: {
    endDate: "required",
    probationEndDate: "optional",
    grossSalary: "required",
    hourlyRate: "hidden",
    paymentInterval: "optional",
    has13thSalary: "optional",
    annualVacationDays: "optional",
    workloadPercent: "optional",
    weeklyHours: "optional",
  },
  SUBSTITUTE: {
    endDate: "required",
    probationEndDate: "hidden",
    grossSalary: "hidden",
    hourlyRate: "required",
    paymentInterval: "hidden",
    has13thSalary: "hidden",
    annualVacationDays: "hidden",
    workloadPercent: "hidden",
    weeklyHours: "hidden",
  },
  EXTERNAL: {
    endDate: "optional",
    probationEndDate: "hidden",
    grossSalary: "hidden",
    hourlyRate: "optional",
    paymentInterval: "hidden",
    has13thSalary: "hidden",
    annualVacationDays: "hidden",
    workloadPercent: "hidden",
    weeklyHours: "hidden",
  },
};

/**
 * All contract-type-dependent fields as a runtime list. Derived from the
 * rules object so it can never drift from the type union — a new field added
 * to CONTRACT_TYPE_RULES automatically shows up here.
 */
export const CONTRACT_TYPE_DEPENDENT_FIELDS: readonly ContractTypeDependentField[] =
  Object.keys(CONTRACT_TYPE_RULES.PERMANENT) as ContractTypeDependentField[];

/**
 * Fallback while no contract type is chosen yet (onboarding drafts, legacy rows
 * created before the type became mandatory): everything stays editable.
 */
export const UNSPECIFIED_CONTRACT_TYPE_RULES: ContractTypeRules = {
  endDate: "optional",
  probationEndDate: "optional",
  grossSalary: "optional",
  hourlyRate: "optional",
  paymentInterval: "optional",
  has13thSalary: "optional",
  annualVacationDays: "optional",
  workloadPercent: "optional",
  weeklyHours: "optional",
};

export function contractTypeRules(
  type?: string | null,
): ContractTypeRules {
  if (!type) return UNSPECIFIED_CONTRACT_TYPE_RULES;
  return (
    CONTRACT_TYPE_RULES[type as EmployeeContractTypeValue] ??
    UNSPECIFIED_CONTRACT_TYPE_RULES
  );
}

/** False only for fields that do not apply to the type at all. */
export function isContractFieldVisible(
  type: string | null | undefined,
  field: ContractTypeDependentField,
): boolean {
  return contractTypeRules(type)[field] !== "hidden";
}

export function isContractFieldRequired(
  type: string | null | undefined,
  field: ContractTypeDependentField,
): boolean {
  return contractTypeRules(type)[field] === "required";
}

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

/** Fields the given contract type requires but that are missing in `values`. */
export function missingRequiredContractFields(
  values: Partial<Record<ContractTypeDependentField, unknown>>,
  type?: string | null,
): ContractTypeDependentField[] {
  const rules = contractTypeRules(type);
  return CONTRACT_TYPE_DEPENDENT_FIELDS.filter(
    (field) => rules[field] === "required" && isBlank(values[field]),
  );
}
