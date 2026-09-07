/**
 * Column catalog for the employee CSV/Excel import. Mirrors the backend
 * catalog in `apps/backend/src/employee-management/employees/employee-import-columns.ts`
 * — keep both in sync. Used for the template download and the format help.
 */
export type EmployeeImportGroup =
  | "person"
  | "hr"
  | "emergency"
  | "contract"
  | "team";

export interface EmployeeImportColumn {
  key: string;
  group: EmployeeImportGroup;
  required?: boolean;
  /** Needs a field-level permission on the backend. */
  isProtected?: boolean;
  example: string;
}

export const EMPLOYEE_IMPORT_GROUPS: readonly EmployeeImportGroup[] = [
  "person",
  "hr",
  "emergency",
  "contract",
  "team",
];

const col = (
  group: EmployeeImportGroup,
  key: string,
  example: string,
  flags: { required?: boolean; isProtected?: boolean } = {},
): EmployeeImportColumn => ({ key, group, example, ...flags });

export const EMPLOYEE_IMPORT_COLUMNS: readonly EmployeeImportColumn[] = [
  col("person", "email", "max@example.com", { required: true }),
  col("person", "firstName", "Max"),
  col("person", "lastName", "Mustermann"),
  col("person", "title", "Herr"),
  col("person", "privateEmail", "max.privat@example.com"),
  col("person", "dateOfBirth", "1990-01-15"),
  col("person", "socialSecurityNumber", "756.1234.5678.97"),
  col("person", "contactPhone", "+41 79 123 45 67"),
  col("person", "contactPhone2", ""),
  col("person", "street", "Musterstrasse"),
  col("person", "houseNumber", "12"),
  col("person", "addressLine2", ""),
  col("person", "postalCode", "8000"),
  col("person", "city", "Zürich"),
  col("person", "country", "CH"),
  col("person", "language", "de"),
  col("person", "persona", "EMPLOYEE"),
  col("person", "timeTrackingEnabled", "true"),
  col("hr", "iban", "CH93 0076 2011 6238 5295 7", { isProtected: true }),
  col("hr", "bankAccountHolder", "Max Mustermann", { isProtected: true }),
  col("hr", "bankName", "Musterbank", { isProtected: true }),
  col("hr", "bvgInsuranceNumber", "", { isProtected: true }),
  col("hr", "withholdingTaxCode", "", { isProtected: true }),
  col("hr", "nationality", "CH", { isProtected: true }),
  col("hr", "residencePermitType", "CITIZEN", { isProtected: true }),
  col("hr", "residencePermitValidUntil", "", { isProtected: true }),
  col("hr", "maritalStatus", "SINGLE", { isProtected: true }),
  col("hr", "denomination", "", { isProtected: true }),
  col("hr", "numberOfChildren", "0", { isProtected: true }),
  col("hr", "onboardingStatus", "NOT_STARTED"),
  col("hr", "ndaSigned", "false"),
  col("hr", "criminalRecordSubmitted", "false"),
  col("emergency", "contact1Name", "Erika Mustermann"),
  col("emergency", "contact1Relationship", "SPOUSE"),
  col("emergency", "contact1Phone", "+41 79 765 43 21"),
  col("emergency", "contact1Email", ""),
  col("emergency", "contact2Name", ""),
  col("emergency", "contact2Relationship", ""),
  col("emergency", "contact2Phone", ""),
  col("emergency", "contact2Email", ""),
  col("emergency", "bloodType", "", { isProtected: true }),
  col("emergency", "allergies", "", { isProtected: true }),
  col("emergency", "chronicConditions", "", { isProtected: true }),
  col("emergency", "emergencyMedications", "", { isProtected: true }),
  col("emergency", "primaryDoctorName", "", { isProtected: true }),
  col("emergency", "primaryDoctorPhone", "", { isProtected: true }),
  col("emergency", "pharmacyName", "", { isProtected: true }),
  col("contract", "contractType", "PERMANENT"),
  col("contract", "position", "Lehrperson"),
  col("contract", "contractStartDate", "2025-08-01"),
  col("contract", "contractEndDate", ""),
  col("contract", "probationEndDate", "2025-10-31"),
  col("contract", "workloadPercent", "80"),
  col("contract", "weeklyHours", "33.6"),
  col("contract", "grossSalary", "6500", { isProtected: true }),
  col("contract", "hourlyRate", "", { isProtected: true }),
  col("contract", "paymentInterval", "MONTHLY_X13", { isProtected: true }),
  col("contract", "has13thSalary", "true", { isProtected: true }),
  col("contract", "annualVacationDays", "25"),
  col("contract", "remainingVacationDays", ""),
  col("contract", "contractNotes", ""),
  col("team", "teamName", ""),
  col("team", "teamRole", "MEMBER"),
  col("team", "roleNames", ""),
];

/** Semicolon-separated CSV with the header row and one example row. */
export function buildEmployeeImportTemplate(): string {
  const escape = (value: string) =>
    /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const header = EMPLOYEE_IMPORT_COLUMNS.map((c) => c.key).join(";");
  const example = EMPLOYEE_IMPORT_COLUMNS.map((c) => escape(c.example)).join(
    ";",
  );
  return `${header}\n${example}\n`;
}
