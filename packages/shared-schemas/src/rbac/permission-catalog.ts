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

export type PermissionLevel = 0 | 1 | 2 | 3;

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
  /**
   * Level in the Kein(0)/Lesen(1)/Bearbeiten(2)/Voll(3) model used by the
   * role overview & comparison matrix. Not set on hidden entries - those
   * live outside the level model entirely.
   */
  level?: 1 | 2 | 3;
};

export const PERMISSION_CATALOG: Entry[] = [
  { code: "ORG_DELETE", category: "organization", feature: "organization", action: "delete", hidden: true },
  { code: "ORG_TRANSFER_OWNERSHIP", category: "organization", feature: "organization", action: "transfer", hidden: true },
  { code: "BILLING_MANAGE", category: "organization", feature: "billing", action: "manage", hidden: true },

  { code: "USER_INVITE", category: "userManagement", feature: "user", action: "invite", level: 2 },
  { code: "USER_REMOVE", category: "userManagement", feature: "user", action: "remove", level: 3 },
  { code: "ROLE_CREATE", category: "userManagement", feature: "role", action: "create", level: 3 },
  { code: "ROLE_DELETE", category: "userManagement", feature: "role", action: "delete", level: 3 },
  { code: "ROLE_ASSIGN", category: "userManagement", feature: "role", action: "assign", level: 2 },

  { code: "TEAM_CREATE", category: "teams", feature: "team", action: "create", level: 2 },
  { code: "TEAM_DELETE", category: "teams", feature: "team", action: "delete", level: 3 },
  { code: "TEAM_MANAGE", category: "teams", feature: "team", action: "manage", level: 3 },

  { code: "EMPLOYEE_READ", category: "employees", feature: "employee", action: "read", level: 1 },
  { code: "EMPLOYEE_WRITE", category: "employees", feature: "employee", action: "write", level: 2 },
  { code: "EMPLOYEE_ABSENCE_CATEGORY_READ", category: "employees", feature: "absenceCategory", action: "read", level: 1 },
  { code: "EMPLOYEE_ABSENCE_CATEGORY_MANAGE", category: "employees", feature: "absenceCategory", action: "manage", level: 3 },
  { code: "TIMESHEET_READ", category: "employees", feature: "timesheet", action: "read", level: 1 },
  { code: "TIMESHEET_WRITE", category: "employees", feature: "timesheet", action: "write", level: 2 },

  { code: "SCHOOL_CLASS_READ", category: "teacher", feature: "schoolClass", action: "read", level: 1 },
  { code: "SCHOOL_CLASS_WRITE", category: "teacher", feature: "schoolClass", action: "write", level: 2 },
  { code: "SCHOOL_CLASS_DELETE", category: "teacher", feature: "schoolClass", action: "delete", level: 3 },
  { code: "CONTACT_PERSON_READ", category: "teacher", feature: "contactPerson", action: "read", level: 1 },
  { code: "CONTACT_PERSON_WRITE", category: "teacher", feature: "contactPerson", action: "write", level: 2 },
  { code: "CONTACT_PERSON_DELETE", category: "teacher", feature: "contactPerson", action: "delete", level: 3 },
  { code: "CURRICULUM_LEVEL_READ", category: "teacher", feature: "curriculumLevel", action: "read", level: 1 },
  { code: "CURRICULUM_LEVEL_MANAGE", category: "teacher", feature: "curriculumLevel", action: "manage", level: 3 },
  { code: "CURRICULUM_READ", category: "teacher", feature: "curriculum", action: "read", level: 1 },
  { code: "CURRICULUM_MANAGE", category: "teacher", feature: "curriculum", action: "manage", level: 3 },

  // Admissions (Aufnahmeprozess)
  { code: "ADMISSION_STAGE_READ", category: "admissions", feature: "admissionStage", action: "read", level: 1 },
  { code: "ADMISSION_STAGE_MANAGE", category: "admissions", feature: "admissionStage", action: "manage", level: 3 },
  { code: "ADMISSION_APPLICATION_READ", category: "admissions", feature: "admissionApplication", action: "read", level: 1 },
  { code: "ADMISSION_APPLICATION_WRITE", category: "admissions", feature: "admissionApplication", action: "write", level: 2 },
  { code: "ADMISSION_APPLICATION_MOVE", category: "admissions", feature: "admissionApplication", action: "move", level: 2 },
  { code: "ADMISSION_APPLICATION_ENROLL", category: "admissions", feature: "admissionApplication", action: "enroll", level: 2 },
  { code: "ADMISSION_APPLICATION_DELETE", category: "admissions", feature: "admissionApplication", action: "delete", level: 3 },
  { code: "ADMISSION_EMAIL_SEND", category: "admissions", feature: "admissionEmail", action: "send", level: 2 },
  { code: "ADMISSION_EMAIL_TEMPLATE_MANAGE", category: "admissions", feature: "admissionEmail", action: "manage", level: 3 },
  { code: "FAMILY_READ", category: "admissions", feature: "family", action: "read", level: 1 },
  { code: "FAMILY_WRITE", category: "admissions", feature: "family", action: "write", level: 2 },

  // Students (Schüler:innen)
  { code: "STUDENT_READ", category: "students", feature: "student", action: "read", level: 1 },
  { code: "STUDENT_WRITE", category: "students", feature: "student", action: "write", level: 2 },
  { code: "STUDENT_DELETE", category: "students", feature: "student", action: "delete", level: 3 },
  { code: "STUDENT_RECORD_READ", category: "students", feature: "studentRecord", action: "read", level: 1 },
  { code: "STUDENT_RECORD_WRITE", category: "students", feature: "studentRecord", action: "write", level: 2 },
  { code: "STUDENT_RECORD_DELETE", category: "students", feature: "studentRecord", action: "delete", level: 3 },
  { code: "STUDENT_RECORD_CATEGORY_WRITE", category: "students", feature: "studentRecordCategory", action: "manage", level: 3 },
  { code: "RECORD_KEEPING_READ", category: "students", feature: "recordKeeping", action: "read", level: 1 },
  { code: "RECORD_KEEPING_WRITE", category: "students", feature: "recordKeeping", action: "write", level: 2 },
  { code: "RECORD_KEEPING_SETTINGS_MANAGE", category: "students", feature: "recordKeeping", action: "manage", level: 3 },

  // Projects (Projektmanagement)
  { code: "PROJECT_READ", category: "projects", feature: "project", action: "read", level: 1 },
  { code: "PROJECT_CREATE", category: "projects", feature: "project", action: "create", level: 2 },
  { code: "PROJECT_MANAGE_ALL", category: "projects", feature: "project", action: "manage", level: 3 },
  { code: "PROJECT_TEMPLATE_MANAGE", category: "projects", feature: "projectTemplate", action: "manage", level: 3 },
  { code: "PROTOCOL_READ", category: "projects", feature: "protocol", action: "read", level: 1 },
  { code: "PROTOCOL_WRITE", category: "projects", feature: "protocol", action: "write", level: 2 },
  { code: "PROTOCOL_DELETE", category: "projects", feature: "protocol", action: "delete", level: 3 },

  // Data protection (Datenschutz / DSGVO / revDSG)
  { code: "CONSENT_READ", category: "dataProtection", feature: "consent", action: "read", level: 1 },
  { code: "CONSENT_MANAGE", category: "dataProtection", feature: "consent", action: "manage", level: 3 },
  { code: "CONSENT_SETTINGS_MANAGE", category: "dataProtection", feature: "consentSettings", action: "manage", level: 3 },
  { code: "DATA_REQUEST_READ", category: "dataProtection", feature: "dataRequest", action: "read", level: 1 },
  { code: "DATA_REQUEST_MANAGE", category: "dataProtection", feature: "dataRequest", action: "manage", level: 3 },
  { code: "RETENTION_READ", category: "dataProtection", feature: "retention", action: "read", level: 1 },
  { code: "RETENTION_MANAGE", category: "dataProtection", feature: "retention", action: "manage", level: 3 },
  { code: "DATA_BREACH_READ", category: "dataProtection", feature: "dataBreach", action: "read", level: 1 },
  { code: "DATA_BREACH_MANAGE", category: "dataProtection", feature: "dataBreach", action: "manage", level: 3 },
  { code: "VVT_READ", category: "dataProtection", feature: "vvt", action: "read", level: 1 },
  { code: "VVT_MANAGE", category: "dataProtection", feature: "vvt", action: "manage", level: 3 },

  { code: "ADDRESS_READ", category: "general", feature: "address", action: "read", level: 1 },
  { code: "ADDRESS_WRITE", category: "general", feature: "address", action: "write", level: 2 },
  { code: "ADDRESS_DELETE", category: "general", feature: "address", action: "delete", level: 3 },
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

function levelEntries(
  category: CategoryKey,
  availableCodes: Set<string>,
): { code: string; level: 1 | 2 | 3 }[] {
  return PERMISSION_CATALOG.filter(
    (e): e is Entry & { level: 1 | 2 | 3 } =>
      !e.hidden &&
      e.level !== undefined &&
      e.category === category &&
      availableCodes.has(e.code),
  );
}

/** Codes of a category up to (and including) the given level. Level 0 => []. */
export function codesForLevel(
  category: CategoryKey,
  level: PermissionLevel,
  availableCodes: Set<string>,
): string[] {
  if (level === 0) return [];
  return levelEntries(category, availableCodes)
    .filter((e) => e.level <= level)
    .map((e) => e.code);
}

/**
 * Detects which level the granted codes of a category correspond to.
 * Returns null ("Individuell") if the set doesn't match any level exactly.
 */
export function detectLevel(
  category: CategoryKey,
  grantedCodes: Set<string>,
  availableCodes: Set<string>,
): PermissionLevel | null {
  const entries = levelEntries(category, availableCodes);
  for (const level of [0, 1, 2, 3] as PermissionLevel[]) {
    const matches = entries.every(
      (e) => grantedCodes.has(e.code) === (e.level <= level),
    );
    if (matches) return level;
  }
  return null;
}

/** Number of category codes at exactly each level, for distribution bars. */
export function categoryLevelCounts(
  category: CategoryKey,
  availableCodes: Set<string>,
): Record<1 | 2 | 3, number> {
  const counts: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  for (const e of levelEntries(category, availableCodes)) {
    counts[e.level] += 1;
  }
  return counts;
}
