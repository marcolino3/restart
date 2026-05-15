export type CategoryKey =
  | "organization"
  | "userManagement"
  | "teams"
  | "employees"
  | "teacher"
  | "general";

export type FeatureKey =
  | "organization"
  | "billing"
  | "user"
  | "role"
  | "team"
  | "employee"
  | "timesheet"
  | "schoolClass"
  | "contactPerson"
  | "admissionStage"
  | "curriculumLevel"
  | "curriculum"
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
  | "transfer";

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
  { code: "TIMESHEET_READ", category: "employees", feature: "timesheet", action: "read" },
  { code: "TIMESHEET_WRITE", category: "employees", feature: "timesheet", action: "write" },

  { code: "SCHOOL_CLASS_READ", category: "teacher", feature: "schoolClass", action: "read" },
  { code: "SCHOOL_CLASS_WRITE", category: "teacher", feature: "schoolClass", action: "write" },
  { code: "SCHOOL_CLASS_DELETE", category: "teacher", feature: "schoolClass", action: "delete" },
  { code: "CONTACT_PERSON_READ", category: "teacher", feature: "contactPerson", action: "read" },
  { code: "CONTACT_PERSON_WRITE", category: "teacher", feature: "contactPerson", action: "write" },
  { code: "CONTACT_PERSON_DELETE", category: "teacher", feature: "contactPerson", action: "delete" },
  { code: "ADMISSION_STAGE_READ", category: "teacher", feature: "admissionStage", action: "read" },
  { code: "ADMISSION_STAGE_MANAGE", category: "teacher", feature: "admissionStage", action: "manage" },
  { code: "CURRICULUM_LEVEL_READ", category: "teacher", feature: "curriculumLevel", action: "read" },
  { code: "CURRICULUM_LEVEL_MANAGE", category: "teacher", feature: "curriculumLevel", action: "manage" },
  { code: "CURRICULUM_READ", category: "teacher", feature: "curriculum", action: "read" },
  { code: "CURRICULUM_MANAGE", category: "teacher", feature: "curriculum", action: "manage" },

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
  "general",
];

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
