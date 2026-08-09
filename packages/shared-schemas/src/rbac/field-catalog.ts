export type FieldAction = "create" | "read" | "update" | "delete";

export type ProtectedField = {
  resource: string;
  field: string;
  actions: FieldAction[];
  sensitivity: "high" | "medium";
  legalBasis?: string;
};

const CRUD: FieldAction[] = ["create", "read", "update", "delete"];
const RU: FieldAction[] = ["read", "update"];

export const PROTECTED_FIELD_CATALOG: ProtectedField[] = [
  // --- employee (base salary/bank fields live on the contract/HR profile, not here) ---
  { resource: "employee", field: "dateOfBirth", actions: RU, sensitivity: "medium" },

  // --- employeeHrProfile ---
  { resource: "employeeHrProfile", field: "iban", actions: RU, sensitivity: "high" },
  { resource: "employeeHrProfile", field: "bankAccountHolder", actions: RU, sensitivity: "high" },
  { resource: "employeeHrProfile", field: "bankName", actions: RU, sensitivity: "high" },
  { resource: "employeeHrProfile", field: "bvgInsuranceNumber", actions: RU, sensitivity: "high" },
  { resource: "employeeHrProfile", field: "withholdingTaxCode", actions: RU, sensitivity: "high" },
  { resource: "employeeHrProfile", field: "nationality", actions: RU, sensitivity: "medium" },
  { resource: "employeeHrProfile", field: "residencePermitType", actions: RU, sensitivity: "medium" },
  { resource: "employeeHrProfile", field: "residencePermitValidUntil", actions: RU, sensitivity: "medium" },
  { resource: "employeeHrProfile", field: "maritalStatus", actions: RU, sensitivity: "medium" },
  { resource: "employeeHrProfile", field: "denomination", actions: RU, sensitivity: "medium" },
  { resource: "employeeHrProfile", field: "numberOfChildren", actions: RU, sensitivity: "medium" },

  // --- employeeContract ---
  { resource: "employeeContract", field: "grossSalary", actions: RU, sensitivity: "high" },
  { resource: "employeeContract", field: "hourlyRate", actions: RU, sensitivity: "high" },
  { resource: "employeeContract", field: "paymentInterval", actions: RU, sensitivity: "high" },
  { resource: "employeeContract", field: "has13thSalary", actions: RU, sensitivity: "high" },

  // --- employeeNote ---
  { resource: "employeeNote", field: "title", actions: CRUD, sensitivity: "high" },
  { resource: "employeeNote", field: "content", actions: CRUD, sensitivity: "high" },
  { resource: "employeeNote", field: "isConfidential", actions: RU, sensitivity: "high" },

  // --- employeeEmergencyContact ---
  { resource: "employeeEmergencyContact", field: "bloodType", actions: RU, sensitivity: "high" },
  { resource: "employeeEmergencyContact", field: "allergies", actions: RU, sensitivity: "high" },
  { resource: "employeeEmergencyContact", field: "chronicConditions", actions: RU, sensitivity: "high" },
  { resource: "employeeEmergencyContact", field: "emergencyMedications", actions: RU, sensitivity: "high" },
  { resource: "employeeEmergencyContact", field: "primaryDoctorName", actions: RU, sensitivity: "medium" },
  { resource: "employeeEmergencyContact", field: "primaryDoctorPhone", actions: RU, sensitivity: "medium" },
  { resource: "employeeEmergencyContact", field: "pharmacyName", actions: RU, sensitivity: "medium" },

  // --- employeeAuditLog ---
  { resource: "employeeAuditLog", field: "changes", actions: ["read"], sensitivity: "high" },

  // --- employeePaidOvertime ---
  { resource: "employeePaidOvertime", field: "amount", actions: RU, sensitivity: "medium" },

  // --- student ---
  { resource: "student", field: "socialSecurityNumber", actions: RU, sensitivity: "high" },
  { resource: "student", field: "dateOfBirth", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "placeOfBirth", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "nationalities", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "firstLanguages", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "familyLanguages", actions: RU, sensitivity: "medium" },

  // --- studentRecord (Foerderprofil / Beobachtungen) ---
  { resource: "studentRecord", field: "content", actions: CRUD, sensitivity: "high" },

  // --- admissionApplication ---
  { resource: "admissionApplication", field: "childNotes", actions: RU, sensitivity: "medium" },
  { resource: "admissionApplication", field: "rejectionReason", actions: RU, sensitivity: "medium" },
];

export function protectedFieldKey(resource: string, field: string): string {
  return `${resource}.${field}`;
}

export const PROTECTED_FIELD_KEYS: ReadonlySet<string> = new Set(
  PROTECTED_FIELD_CATALOG.map((f) => protectedFieldKey(f.resource, f.field)),
);
