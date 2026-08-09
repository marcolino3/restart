export type CategoryKey =
  | "organization"
  | "userManagement"
  | "teams"
  | "employees"
  | "teacher"
  | "admissions"
  | "students"
  | "projects"
  | "dataProtection"
  | "general";

export type FeatureKey =
  | "organization"
  | "billing"
  | "user"
  | "role"
  | "team"
  | "employee"
  | "absenceCategory"
  | "timesheet"
  | "schoolClass"
  | "contactPerson"
  | "family"
  | "admissionStage"
  | "admissionApplication"
  | "admissionEmail"
  | "student"
  | "studentRecord"
  | "studentRecordCategory"
  | "recordKeeping"
  | "curriculumLevel"
  | "curriculum"
  | "project"
  | "projectTemplate"
  | "protocol"
  | "consent"
  | "consentSettings"
  | "dataRequest"
  | "retention"
  | "dataBreach"
  | "vvt"
  | "address";

export type ActionKey =
  | "read"
  | "write"
  | "create"
  | "delete"
  | "manage"
  | "assign"
  | "invite"
  | "remove"
  | "transfer"
  | "send"
  | "move"
  | "enroll";

type Entry = {
  code: string;
  category: CategoryKey;
  feature: FeatureKey;
  action: ActionKey;
  /**
   * Hidden from the role management UI. Owner-only permissions tied to
   * the org owner role and never assignable elsewhere via this screen.
   */
  hidden?: boolean;
};

export const PERMISSION_CATALOG: Entry[] = [
  { code: "ORG_DELETE", category: "organization", feature: "organization", action: "delete", hidden: true },
  { code: "ORG_TRANSFER_OWNERSHIP", category: "organization", feature: "organization", action: "transfer", hidden: true },
  { code: "BILLING_MANAGE", category: "organization", feature: "billing", action: "manage", hidden: true },

  { code: "USER_INVITE", category: "userManagement", feature: "user", action: "invite" },
  { code: "USER_REMOVE", category: "userManagement", feature: "user", action: "remove" },
  { code: "ROLE_CREATE", category: "userManagement", feature: "role", action: "create" },
  { code: "ROLE_DELETE", category: "userManagement", feature: "role", action: "delete" },
  { code: "ROLE_ASSIGN", category: "userManagement", feature: "role", action: "assign" },

  { code: "TEAM_CREATE", category: "teams", feature: "team", action: "create" },
  { code: "TEAM_DELETE", category: "teams", feature: "team", action: "delete" },
  { code: "TEAM_MANAGE", category: "teams", feature: "team", action: "manage" },

  { code: "EMPLOYEE_READ", category: "employees", feature: "employee", action: "read" },
  { code: "EMPLOYEE_WRITE", category: "employees", feature: "employee", action: "write" },
  { code: "EMPLOYEE_ABSENCE_CATEGORY_READ", category: "employees", feature: "absenceCategory", action: "read" },
  { code: "EMPLOYEE_ABSENCE_CATEGORY_MANAGE", category: "employees", feature: "absenceCategory", action: "manage" },
  { code: "TIMESHEET_READ", category: "employees", feature: "timesheet", action: "read" },
  { code: "TIMESHEET_WRITE", category: "employees", feature: "timesheet", action: "write" },

  { code: "SCHOOL_CLASS_READ", category: "teacher", feature: "schoolClass", action: "read" },
  { code: "SCHOOL_CLASS_WRITE", category: "teacher", feature: "schoolClass", action: "write" },
  { code: "SCHOOL_CLASS_DELETE", category: "teacher", feature: "schoolClass", action: "delete" },
  { code: "CONTACT_PERSON_READ", category: "teacher", feature: "contactPerson", action: "read" },
  { code: "CONTACT_PERSON_WRITE", category: "teacher", feature: "contactPerson", action: "write" },
  { code: "CONTACT_PERSON_DELETE", category: "teacher", feature: "contactPerson", action: "delete" },
  { code: "CURRICULUM_LEVEL_READ", category: "teacher", feature: "curriculumLevel", action: "read" },
  { code: "CURRICULUM_LEVEL_MANAGE", category: "teacher", feature: "curriculumLevel", action: "manage" },
  { code: "CURRICULUM_READ", category: "teacher", feature: "curriculum", action: "read" },
  { code: "CURRICULUM_MANAGE", category: "teacher", feature: "curriculum", action: "manage" },

  // Admissions (Aufnahmeprozess)
  { code: "ADMISSION_STAGE_READ", category: "admissions", feature: "admissionStage", action: "read" },
  { code: "ADMISSION_STAGE_MANAGE", category: "admissions", feature: "admissionStage", action: "manage" },
  { code: "ADMISSION_APPLICATION_READ", category: "admissions", feature: "admissionApplication", action: "read" },
  { code: "ADMISSION_APPLICATION_WRITE", category: "admissions", feature: "admissionApplication", action: "write" },
  { code: "ADMISSION_APPLICATION_MOVE", category: "admissions", feature: "admissionApplication", action: "move" },
  { code: "ADMISSION_APPLICATION_ENROLL", category: "admissions", feature: "admissionApplication", action: "enroll" },
  { code: "ADMISSION_APPLICATION_DELETE", category: "admissions", feature: "admissionApplication", action: "delete" },
  { code: "ADMISSION_EMAIL_SEND", category: "admissions", feature: "admissionEmail", action: "send" },
  { code: "ADMISSION_EMAIL_TEMPLATE_MANAGE", category: "admissions", feature: "admissionEmail", action: "manage" },
  { code: "FAMILY_READ", category: "admissions", feature: "family", action: "read" },
  { code: "FAMILY_WRITE", category: "admissions", feature: "family", action: "write" },

  // Students (Schüler:innen)
  { code: "STUDENT_READ", category: "students", feature: "student", action: "read" },
  { code: "STUDENT_WRITE", category: "students", feature: "student", action: "write" },
  { code: "STUDENT_DELETE", category: "students", feature: "student", action: "delete" },
  { code: "STUDENT_RECORD_READ", category: "students", feature: "studentRecord", action: "read" },
  { code: "STUDENT_RECORD_WRITE", category: "students", feature: "studentRecord", action: "write" },
  { code: "STUDENT_RECORD_DELETE", category: "students", feature: "studentRecord", action: "delete" },
  { code: "STUDENT_RECORD_CATEGORY_WRITE", category: "students", feature: "studentRecordCategory", action: "manage" },
  { code: "RECORD_KEEPING_READ", category: "students", feature: "recordKeeping", action: "read" },
  { code: "RECORD_KEEPING_WRITE", category: "students", feature: "recordKeeping", action: "write" },
  { code: "RECORD_KEEPING_SETTINGS_MANAGE", category: "students", feature: "recordKeeping", action: "manage" },

  // Projects (Projektmanagement)
  { code: "PROJECT_READ", category: "projects", feature: "project", action: "read" },
  { code: "PROJECT_CREATE", category: "projects", feature: "project", action: "create" },
  { code: "PROJECT_MANAGE_ALL", category: "projects", feature: "project", action: "manage" },
  { code: "PROJECT_TEMPLATE_MANAGE", category: "projects", feature: "projectTemplate", action: "manage" },
  { code: "PROTOCOL_READ", category: "projects", feature: "protocol", action: "read" },
  { code: "PROTOCOL_WRITE", category: "projects", feature: "protocol", action: "write" },
  { code: "PROTOCOL_DELETE", category: "projects", feature: "protocol", action: "delete" },

  // Data protection (Datenschutz / DSGVO / revDSG)
  { code: "CONSENT_READ", category: "dataProtection", feature: "consent", action: "read" },
  { code: "CONSENT_MANAGE", category: "dataProtection", feature: "consent", action: "manage" },
  { code: "CONSENT_SETTINGS_MANAGE", category: "dataProtection", feature: "consentSettings", action: "manage" },
  { code: "DATA_REQUEST_READ", category: "dataProtection", feature: "dataRequest", action: "read" },
  { code: "DATA_REQUEST_MANAGE", category: "dataProtection", feature: "dataRequest", action: "manage" },
  { code: "RETENTION_READ", category: "dataProtection", feature: "retention", action: "read" },
  { code: "RETENTION_MANAGE", category: "dataProtection", feature: "retention", action: "manage" },
  { code: "DATA_BREACH_READ", category: "dataProtection", feature: "dataBreach", action: "read" },
  { code: "DATA_BREACH_MANAGE", category: "dataProtection", feature: "dataBreach", action: "manage" },
  { code: "VVT_READ", category: "dataProtection", feature: "vvt", action: "read" },
  { code: "VVT_MANAGE", category: "dataProtection", feature: "vvt", action: "manage" },

  { code: "ADDRESS_READ", category: "general", feature: "address", action: "read" },
  { code: "ADDRESS_WRITE", category: "general", feature: "address", action: "write" },
  { code: "ADDRESS_DELETE", category: "general", feature: "address", action: "delete" },
];

export const CATEGORY_ORDER: CategoryKey[] = [
  "organization",
  "userManagement",
  "teams",
  "employees",
  "teacher",
  "admissions",
  "students",
  "projects",
  "dataProtection",
  "general",
];

// Categories reserved for admin-personas (ADMIN, HR, OFFICE). In the role
// matrix they are only offered to admin-system-roles (ORG_OWNER, ORG_ADMIN,
// HR_MANAGER, OFFICE) or to roles that already hold a permission from the
// category — so an operative role like TEAM_LEAD keeps TEAM_MANAGE editable.
// Kept in sync with ADMIN_ONLY_PERMISSION_CODES in apps/backend.
export const ADMIN_ONLY_CATEGORIES: ReadonlySet<CategoryKey> = new Set<CategoryKey>([
  "organization",
  "userManagement",
  "teams",
]);

export function isAdminOnlyCategory(category: CategoryKey): boolean {
  return ADMIN_ONLY_CATEGORIES.has(category);
}

export type GroupedFeature = {
  feature: FeatureKey;
  actions: { code: string; action: ActionKey }[];
};

export type GroupedCategory = {
  category: CategoryKey;
  features: GroupedFeature[];
  codes: string[];
};

export function groupCatalog(availableCodes: Set<string>): GroupedCategory[] {
  const byCategory = new Map<CategoryKey, Map<FeatureKey, GroupedFeature>>();

  for (const entry of PERMISSION_CATALOG) {
    if (entry.hidden) continue;
    if (!availableCodes.has(entry.code)) continue;
    let features = byCategory.get(entry.category);
    if (!features) {
      features = new Map();
      byCategory.set(entry.category, features);
    }
    let grouped = features.get(entry.feature);
    if (!grouped) {
      grouped = { feature: entry.feature, actions: [] };
      features.set(entry.feature, grouped);
    }
    grouped.actions.push({ code: entry.code, action: entry.action });
  }

  return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => {
    const features = Array.from(byCategory.get(category)!.values());
    return {
      category,
      features,
      codes: features.flatMap((f) => f.actions.map((a) => a.code)),
    };
  });
}
