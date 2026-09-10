import { DateTime } from 'luxon';

import { TemplateVariables } from '@/common/util/render-template';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Organization } from '@/organizations/entities/organization.entity';

/**
 * The placeholder keys a contract template may reference. Surfaced to the UI
 * so editors can insert tokens, and used to build the variable map. Must stay
 * in sync with the frontend list
 * (apps/web/features/contract-templates/placeholders.ts).
 */
export const CONTRACT_TEMPLATE_PLACEHOLDERS = [
  'employeeFullName',
  'employeeFirstName',
  'employeeLastName',
  'employeeAddress',
  'employeeDateOfBirth',
  'employeeSsn',
  'position',
  'contractType',
  'startDate',
  'endDate',
  'probationEndDate',
  'workloadPercent',
  'weeklyHours',
  'grossSalary',
  'hourlyRate',
  'annualVacationDays',
  'orgName',
  'orgAddress',
  'todayDate',
] as const;

export type ContractTemplatePlaceholder =
  (typeof CONTRACT_TEMPLATE_PLACEHOLDERS)[number];

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Unbefristet',
  TEMPORARY: 'Befristet',
  HOURLY: 'Stundenlohn',
  INTERNSHIP: 'Praktikum',
  APPRENTICESHIP: 'Lehre',
  SUBSTITUTE: 'Stellvertretung',
  EXTERNAL: 'Extern',
};

function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  const dt = DateTime.fromISO(iso);
  return dt.isValid ? dt.toFormat('dd.MM.yyyy') : '';
}

function fmtMoney(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
  }).format(n);
}

function fmtNumber(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('de-CH', {
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Builds the variable map for one contract. The contract must be loaded with
 * `employee.membership.user` (name, address, SSN); the organization supplies
 * the letterhead data.
 */
export function buildContractVariables(
  contract: EmployeeContract,
  organization: Organization | null,
): TemplateVariables {
  const user = contract.employee?.membership?.user;

  const employeeAddress = user
    ? [
        [user.street, user.houseNumber].filter(Boolean).join(' '),
        [user.postalCode, user.city].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const orgAddress = organization
    ? [
        organization.street,
        [organization.zip, organization.city].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return {
    employeeFullName: user
      ? [user.firstName, user.lastName].filter(Boolean).join(' ')
      : '',
    employeeFirstName: user?.firstName ?? '',
    employeeLastName: user?.lastName ?? '',
    employeeAddress,
    employeeDateOfBirth: fmtDate(user?.dateOfBirth ?? null),
    employeeSsn: user?.socialSecurityNumber ?? '',
    position: contract.position ?? '',
    contractType: contract.contractType
      ? (CONTRACT_TYPE_LABELS[contract.contractType] ?? contract.contractType)
      : '',
    startDate: fmtDate(contract.startDate),
    endDate: fmtDate(contract.endDate),
    probationEndDate: fmtDate(contract.probationEndDate),
    workloadPercent:
      contract.workloadPercent !== null &&
      contract.workloadPercent !== undefined
        ? `${fmtNumber(contract.workloadPercent)} %`
        : '',
    weeklyHours: fmtNumber(contract.weeklyHours),
    grossSalary: fmtMoney(contract.grossSalary),
    hourlyRate: fmtMoney(contract.hourlyRate),
    annualVacationDays:
      contract.annualVacationDays !== null &&
      contract.annualVacationDays !== undefined
        ? String(contract.annualVacationDays)
        : '',
    orgName: organization?.name ?? '',
    orgAddress,
    todayDate: DateTime.now().toFormat('dd.MM.yyyy'),
  };
}
