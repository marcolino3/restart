import { BadRequestException } from '@nestjs/common';
import { EmployeeContractType } from './entities/employee-contract.entity';

/**
 * How a contract field behaves for a given contract type:
 * - `required`: must carry a value, otherwise the contract is rejected
 * - `optional`: may be set
 * - `hidden`: not applicable; cleared server-side so a client cannot persist
 *   values that contradict the type (e.g. a 13th salary on an hourly contract)
 */
export type ContractFieldMode = 'required' | 'optional' | 'hidden';

export type ContractTypeDependentField =
  | 'endDate'
  | 'probationEndDate'
  | 'grossSalary'
  | 'hourlyRate'
  | 'paymentInterval'
  | 'has13thSalary'
  | 'annualVacationDays'
  | 'workloadPercent'
  | 'weeklyHours';

export type ContractTypeRules = Record<
  ContractTypeDependentField,
  ContractFieldMode
>;

/**
 * Mirrored in `packages/shared-schemas/src/employees/contract-type-rules.ts`,
 * which drives the web forms. The backend deliberately has no dependency on the
 * Zod package (ESM), so both tables must be kept in sync by hand.
 *
 * Hourly, substitute and freelance staff are paid per hour and settle holidays
 * via a percentage supplement, hence no monthly salary and no vacation days.
 * A workload percentage (and the full-time weekly-hours reference it needs) is
 * meaningless for them as well: they are paid for the hours actually worked,
 * not against a fixed share of a full-time week.
 */
export const CONTRACT_TYPE_RULES: Record<
  EmployeeContractType,
  ContractTypeRules
> = {
  [EmployeeContractType.PERMANENT]: {
    endDate: 'optional',
    probationEndDate: 'optional',
    grossSalary: 'required',
    hourlyRate: 'hidden',
    paymentInterval: 'optional',
    has13thSalary: 'optional',
    annualVacationDays: 'optional',
    workloadPercent: 'optional',
    weeklyHours: 'optional',
  },
  [EmployeeContractType.TEMPORARY]: {
    endDate: 'required',
    probationEndDate: 'optional',
    grossSalary: 'required',
    hourlyRate: 'hidden',
    paymentInterval: 'optional',
    has13thSalary: 'optional',
    annualVacationDays: 'optional',
    workloadPercent: 'optional',
    weeklyHours: 'optional',
  },
  [EmployeeContractType.HOURLY]: {
    endDate: 'optional',
    probationEndDate: 'hidden',
    grossSalary: 'hidden',
    hourlyRate: 'required',
    paymentInterval: 'hidden',
    has13thSalary: 'hidden',
    annualVacationDays: 'hidden',
    workloadPercent: 'hidden',
    weeklyHours: 'hidden',
  },
  [EmployeeContractType.INTERNSHIP]: {
    endDate: 'required',
    probationEndDate: 'hidden',
    grossSalary: 'optional',
    hourlyRate: 'hidden',
    paymentInterval: 'optional',
    has13thSalary: 'optional',
    annualVacationDays: 'optional',
    workloadPercent: 'optional',
    weeklyHours: 'optional',
  },
  [EmployeeContractType.APPRENTICESHIP]: {
    endDate: 'required',
    probationEndDate: 'optional',
    grossSalary: 'required',
    hourlyRate: 'hidden',
    paymentInterval: 'optional',
    has13thSalary: 'optional',
    annualVacationDays: 'optional',
    workloadPercent: 'optional',
    weeklyHours: 'optional',
  },
  [EmployeeContractType.SUBSTITUTE]: {
    endDate: 'required',
    probationEndDate: 'hidden',
    grossSalary: 'hidden',
    hourlyRate: 'required',
    paymentInterval: 'hidden',
    has13thSalary: 'hidden',
    annualVacationDays: 'hidden',
    workloadPercent: 'hidden',
    weeklyHours: 'hidden',
  },
  [EmployeeContractType.EXTERNAL]: {
    endDate: 'optional',
    probationEndDate: 'hidden',
    grossSalary: 'hidden',
    hourlyRate: 'optional',
    paymentInterval: 'hidden',
    has13thSalary: 'hidden',
    annualVacationDays: 'hidden',
    workloadPercent: 'hidden',
    weeklyHours: 'hidden',
  },
};

/**
 * Fallback while no contract type is chosen yet (onboarding drafts, legacy rows
 * created before the type became mandatory): everything stays editable.
 */
export const UNSPECIFIED_CONTRACT_TYPE_RULES: ContractTypeRules = {
  endDate: 'optional',
  probationEndDate: 'optional',
  grossSalary: 'optional',
  hourlyRate: 'optional',
  paymentInterval: 'optional',
  has13thSalary: 'optional',
  annualVacationDays: 'optional',
  workloadPercent: 'optional',
  weeklyHours: 'optional',
};

export function contractTypeRules(
  type?: EmployeeContractType | null,
): ContractTypeRules {
  return type ? CONTRACT_TYPE_RULES[type] : UNSPECIFIED_CONTRACT_TYPE_RULES;
}

type ContractFieldValues = Partial<
  Record<ContractTypeDependentField, unknown>
> | null;

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || value === '';

/** Fields the given contract type requires but that are missing in `values`. */
export function missingRequiredContractFields(
  values: ContractFieldValues,
  type?: EmployeeContractType | null,
  hiddenByPermission?: ReadonlySet<ContractTypeDependentField>,
): ContractTypeDependentField[] {
  const rules = contractTypeRules(type);
  return (Object.keys(rules) as ContractTypeDependentField[]).filter(
    (field) =>
      rules[field] === 'required' &&
      isBlank(values?.[field]) &&
      !hiddenByPermission?.has(field),
  );
}

/**
 * Rejects a contract whose type-specific required fields are not filled in
 * (e.g. a fixed-term contract without an end date). A field the caller lacks
 * read access to (field-level RBAC) never counts as missing — it can never
 * appear in the input, so requiring it would make the contract unsubmittable
 * for that caller.
 */
export function assertContractTypeFields(
  values: ContractFieldValues,
  type?: EmployeeContractType | null,
  hiddenByPermission?: ReadonlySet<ContractTypeDependentField>,
): void {
  const missing = missingRequiredContractFields(
    values,
    type,
    hiddenByPermission,
  );
  if (missing.length > 0) {
    throw new BadRequestException(
      `Contract type ${type} requires: ${missing.join(', ')}`,
    );
  }
}

/**
 * Nulls out every field that does not apply to the contract type. Mutates and
 * returns `values` so it can be used inline before persisting.
 */
export function clearHiddenContractFields<T extends ContractFieldValues>(
  values: T,
  type?: EmployeeContractType | null,
): T {
  if (!values) return values;
  const rules = contractTypeRules(type);
  for (const field of Object.keys(rules) as ContractTypeDependentField[]) {
    if (rules[field] === 'hidden') {
      (values as Record<string, unknown>)[field] = null;
    }
  }
  return values;
}
