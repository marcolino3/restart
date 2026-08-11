import type { CategoryKey } from "./permission-catalog";

export type FieldAction = "create" | "read" | "update" | "delete";

/** DSG Art. 5 "besondere Personendaten" marker (health, religion, origin, support needs). */
export const LEGAL_BASIS_DSG_ART5 = "DSG-5";

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
  { resource: "employeeHrProfile", field: "nationality", actions: RU, sensitivity: "medium", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "employeeHrProfile", field: "residencePermitType", actions: RU, sensitivity: "medium", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "employeeHrProfile", field: "residencePermitValidUntil", actions: RU, sensitivity: "medium", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "employeeHrProfile", field: "maritalStatus", actions: RU, sensitivity: "medium" },
  { resource: "employeeHrProfile", field: "denomination", actions: RU, sensitivity: "medium", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "employeeHrProfile", field: "numberOfChildren", actions: RU, sensitivity: "medium" },

  // --- employeeContract ---
  { resource: "employeeContract", field: "grossSalary", actions: RU, sensitivity: "high" },
  { resource: "employeeContract", field: "hourlyRate", actions: RU, sensitivity: "high" },
  { resource: "employeeContract", field: "paymentInterval", actions: RU, sensitivity: "high" },
  { resource: "employeeContract", field: "has13thSalary", actions: RU, sensitivity: "high" },

  // --- employeeNote ---
  { resource: "employeeNote", field: "title", actions: CRUD, sensitivity: "high" },
  { resource: "employeeNote", field: "content", actions: CRUD, sensitivity: "high", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "employeeNote", field: "isConfidential", actions: RU, sensitivity: "high" },

  // --- employeeEmergencyProfile ---
  { resource: "employeeEmergencyProfile", field: "bloodType", actions: RU, sensitivity: "high", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "employeeEmergencyProfile", field: "allergies", actions: RU, sensitivity: "high", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "employeeEmergencyProfile", field: "chronicConditions", actions: RU, sensitivity: "high", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "employeeEmergencyProfile", field: "emergencyMedications", actions: RU, sensitivity: "high", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "employeeEmergencyProfile", field: "primaryDoctorName", actions: RU, sensitivity: "medium" },
  { resource: "employeeEmergencyProfile", field: "primaryDoctorPhone", actions: RU, sensitivity: "medium" },
  { resource: "employeeEmergencyProfile", field: "pharmacyName", actions: RU, sensitivity: "medium" },

  // --- employeeAuditLog ---
  { resource: "employeeAuditLog", field: "oldValue", actions: ["read"], sensitivity: "high" },
  { resource: "employeeAuditLog", field: "newValue", actions: ["read"], sensitivity: "high" },

  // --- employeePaidOvertime ---
  { resource: "employeePaidOvertime", field: "minutes", actions: RU, sensitivity: "medium" },

  // --- student ---
  { resource: "student", field: "socialSecurityNumber", actions: RU, sensitivity: "high", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "student", field: "dateOfBirth", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "placeOfBirth", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "nationalities", actions: RU, sensitivity: "medium", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "student", field: "firstLanguages", actions: RU, sensitivity: "medium" },
  { resource: "student", field: "familyLanguages", actions: RU, sensitivity: "medium" },

  // --- studentRecordEntry (Foerderprofil / Beobachtungen) ---
  { resource: "studentRecordEntry", field: "content", actions: CRUD, sensitivity: "high", legalBasis: LEGAL_BASIS_DSG_ART5 },

  // --- admissionApplication ---
  { resource: "admissionApplication", field: "childNotes", actions: RU, sensitivity: "medium", legalBasis: LEGAL_BASIS_DSG_ART5 },
  { resource: "admissionApplication", field: "rejectionReason", actions: RU, sensitivity: "medium" },

  // --- admissionAuditLog ---
  { resource: "admissionAuditLog", field: "oldValue", actions: ["read"], sensitivity: "high" },
  { resource: "admissionAuditLog", field: "newValue", actions: ["read"], sensitivity: "high" },
];

export function protectedFieldKey(resource: string, field: string): string {
  return `${resource}.${field}`;
}

export const PROTECTED_FIELD_KEYS: ReadonlySet<string> = new Set(
  PROTECTED_FIELD_CATALOG.map((f) => protectedFieldKey(f.resource, f.field)),
);

export function isSpecialCategory(field: ProtectedField): boolean {
  return field.legalBasis === LEGAL_BASIS_DSG_ART5;
}

export const SPECIAL_CATEGORY_FIELD_COUNT = PROTECTED_FIELD_CATALOG.filter(
  isSpecialCategory,
).length;

// Maps a field resource to the permission-catalog category it is gated
// behind, so the role UI can grey out a field group when the parent
// category has level "Kein" (no access at all).
const RESOURCE_CATEGORY: Record<string, CategoryKey> = {
  employeeHrProfile: "employees",
  employeeContract: "employees",
  employeeNote: "employees",
  employeeEmergencyProfile: "employees",
  employeeAuditLog: "employees",
  employeePaidOvertime: "employees",
  student: "students",
  studentRecordEntry: "students",
  admissionApplication: "admissions",
  admissionAuditLog: "admissions",
};

export function categoryForResource(resource: string): CategoryKey | undefined {
  return RESOURCE_CATEGORY[resource];
}

export type GroupedFieldResource = {
  resource: string;
  category?: CategoryKey;
  fields: ProtectedField[];
};

export function groupFieldCatalog(): GroupedFieldResource[] {
  const byResource = new Map<string, ProtectedField[]>();
  for (const entry of PROTECTED_FIELD_CATALOG) {
    let fields = byResource.get(entry.resource);
    if (!fields) {
      fields = [];
      byResource.set(entry.resource, fields);
    }
    fields.push(entry);
  }
  return Array.from(byResource.entries()).map(([resource, fields]) => ({
    resource,
    category: RESOURCE_CATEGORY[resource],
    fields,
  }));
}
