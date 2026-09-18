import type { FieldAction } from '@restart/shared-schemas/rbac/field-catalog';

/**
 * Column catalog for the employee spreadsheet import. Header names are the
 * camelCase keys below (matched case-insensitively). The frontend mirrors this
 * list in `apps/web/features/employees/employee-import-columns.ts` for the
 * template download and the format help box — keep both in sync.
 */
export type EmployeeImportGroup =
  'person' | 'hr' | 'emergency' | 'contract' | 'team';

export interface EmployeeImportColumn {
  key: string;
  group: EmployeeImportGroup;
  /** Field-level RBAC grant required to import this column (fail closed). */
  protectedField?: { resource: string; field: string; action: FieldAction };
}

const person = (key: string): EmployeeImportColumn => ({
  key,
  group: 'person',
});
const hr = (key: string, isProtected = false): EmployeeImportColumn => ({
  key,
  group: 'hr',
  ...(isProtected && {
    protectedField: {
      resource: 'employeeHrProfile',
      field: key,
      action: 'update' as const,
    },
  }),
});
const emergency = (key: string, isProtected = false): EmployeeImportColumn => ({
  key,
  group: 'emergency',
  ...(isProtected && {
    protectedField: {
      resource: 'employeeEmergencyProfile',
      field: key,
      action: 'update' as const,
    },
  }),
});
const contract = (
  key: string,
  protectedFieldName?: string,
): EmployeeImportColumn => ({
  key,
  group: 'contract',
  ...(protectedFieldName && {
    protectedField: {
      resource: 'employeeContract',
      field: protectedFieldName,
      action: 'create' as const,
    },
  }),
});
const team = (key: string): EmployeeImportColumn => ({ key, group: 'team' });

export const EMPLOYEE_IMPORT_COLUMNS: readonly EmployeeImportColumn[] = [
  // Person + address
  person('email'),
  person('firstName'),
  person('lastName'),
  person('title'),
  person('privateEmail'),
  person('dateOfBirth'),
  person('socialSecurityNumber'),
  person('contactPhone'),
  person('contactPhone2'),
  person('street'),
  person('houseNumber'),
  person('addressLine2'),
  person('postalCode'),
  person('city'),
  person('country'),
  person('language'),
  person('persona'),
  person('timeTrackingEnabled'),
  // HR profile
  hr('iban', true),
  hr('bankAccountHolder', true),
  hr('bankName', true),
  hr('bvgInsuranceNumber', true),
  hr('withholdingTaxCode', true),
  hr('nationality', true),
  hr('residencePermitType', true),
  hr('residencePermitValidUntil', true),
  hr('maritalStatus', true),
  hr('denomination', true),
  hr('numberOfChildren', true),
  hr('onboardingStatus'),
  hr('ndaSigned'),
  hr('criminalRecordSubmitted'),
  // Emergency profile
  emergency('contact1Name'),
  emergency('contact1Relationship'),
  emergency('contact1Phone'),
  emergency('contact1Email'),
  emergency('contact2Name'),
  emergency('contact2Relationship'),
  emergency('contact2Phone'),
  emergency('contact2Email'),
  emergency('bloodType', true),
  emergency('allergies', true),
  emergency('chronicConditions', true),
  emergency('emergencyMedications', true),
  emergency('primaryDoctorName', true),
  emergency('primaryDoctorPhone', true),
  emergency('pharmacyName', true),
  // First contract
  contract('contractType'),
  contract('position'),
  contract('contractStartDate'),
  contract('contractEndDate'),
  contract('probationEndDate'),
  contract('workloadPercent'),
  contract('weeklyHours'),
  contract('grossSalary', 'grossSalary'),
  contract('hourlyRate', 'hourlyRate'),
  contract('paymentInterval', 'paymentInterval'),
  contract('has13thSalary', 'has13thSalary'),
  contract('annualVacationDays'),
  contract('remainingVacationDays'),
  contract('contractNotes'),
  // Team + roles
  team('teamName'),
  team('teamRole'),
  team('roleNames'),
];

export const EMPLOYEE_IMPORT_COLUMN_BY_KEY: ReadonlyMap<
  string,
  EmployeeImportColumn
> = new Map(EMPLOYEE_IMPORT_COLUMNS.map((c) => [c.key.toLowerCase(), c]));

export const EMPLOYEE_IMPORT_MAX_ROWS = 1000;
