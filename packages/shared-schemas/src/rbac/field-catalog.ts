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

  // --- employeeEmergencyProfile ---
  { resource: "employeeEmergencyProfile", field: "bloodType", actions: RU, sensitivity: "high" },
  { resource: "employeeEmergencyProfile", field: "allergies", actions: RU, sensitivity: "high" },
  { resource: "employeeEmergencyProfile", field: "chronicConditions", actions: RU, sensitivity: "high" },
  { resource: "employeeEmergencyProfile", field: "emergencyMedications", actions: RU, sensitivity: "high" },
  { resource: "employeeEmergencyProfile", field: "primaryDoctorName", actions: RU, sensitivity: "medium" },
  { resource: "employeeEmergencyProfile", field: "primaryDoctorPhone", actions: RU, sensitivity: "medium" },
  { resource: "employeeEmergencyProfile", field: "pharmacyName", actions: RU, sensitivity: "medium" },

  // --- employeeAuditLog ---
  { resource: "employeeAuditLog", field: "oldValue", actions: ["read"], sensitivity: "high" },
  { resource: "employeeAuditLog", field: "newValue", actions: ["read"], sensitivity: "high" },

  // --- employeePaidOvertime ---
  { resource: "employeePaidOvertime", field: "minutes", actions: RU, sensitivity: "medium" },

  // --- student ---
  { resource: "student", field: "socialSecurityNumber", actions: RU, sensitivity: "high" },
  { resource: "student", field: "dateOfBirth", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "placeOfBirth", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "nationalities", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "firstLanguages", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "familyLanguages", actions: RU, sensitivity: "medium" },

  // --- studentRecordEntry (Foerderprofil / Beobachtungen) ---
  { resource: "studentRecordEntry", field: "content", actions: CRUD, sensitivity: "high" },

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
