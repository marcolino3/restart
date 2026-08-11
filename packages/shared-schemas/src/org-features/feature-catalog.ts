export enum OrgFeatureKey {
  // CORE
  TIME_TRACKING = "TIME_TRACKING",
  TIME_REPORTS = "TIME_REPORTS",
  ABSENCES = "ABSENCES",
  EMPLOYEES = "EMPLOYEES",
  // PEDAGOGY
  CLASSES = "CLASSES",
  CURRICULA = "CURRICULA",
  PROGRESS = "PROGRESS",
  LEARNING_REPORTS = "LEARNING_REPORTS",
  // ADMISSIONS
  ADMISSIONS = "ADMISSIONS",
  CONTACT_PERSONS = "CONTACT_PERSONS",
  PARENT_PORTAL = "PARENT_PORTAL",
  // COLLABORATION
  PROJECTS = "PROJECTS",
  MY_TASKS = "MY_TASKS",
  CHATS = "CHATS",
  PROTOCOLS = "PROTOCOLS",
}

export type OrgFeatureSection =
  | "CORE"
  | "PEDAGOGY"
  | "ADMISSIONS"
  | "COLLABORATION";

export type OrgFeatureCatalogEntry = {
  section: OrgFeatureSection;
  dependsOn?: OrgFeatureKey;
  beta?: boolean;
  defaultEnabled: boolean;
};

export const FEATURE_CATALOG: Record<OrgFeatureKey, OrgFeatureCatalogEntry> =
  {
    [OrgFeatureKey.TIME_TRACKING]: { section: "CORE", defaultEnabled: true },
    [OrgFeatureKey.TIME_REPORTS]: {
      section: "CORE",
      dependsOn: OrgFeatureKey.TIME_TRACKING,
      defaultEnabled: true,
    },
    [OrgFeatureKey.ABSENCES]: { section: "CORE", defaultEnabled: true },
    [OrgFeatureKey.EMPLOYEES]: { section: "CORE", defaultEnabled: true },

    [OrgFeatureKey.CLASSES]: { section: "PEDAGOGY", defaultEnabled: true },
    [OrgFeatureKey.CURRICULA]: { section: "PEDAGOGY", defaultEnabled: true },
    [OrgFeatureKey.PROGRESS]: { section: "PEDAGOGY", defaultEnabled: true },
    [OrgFeatureKey.LEARNING_REPORTS]: {
      section: "PEDAGOGY",
      dependsOn: OrgFeatureKey.PROGRESS,
      beta: true,
      defaultEnabled: false,
    },

    [OrgFeatureKey.ADMISSIONS]: { section: "ADMISSIONS", defaultEnabled: true },
    [OrgFeatureKey.CONTACT_PERSONS]: {
      section: "ADMISSIONS",
      defaultEnabled: true,
    },
    [OrgFeatureKey.PARENT_PORTAL]: {
      section: "ADMISSIONS",
      dependsOn: OrgFeatureKey.CONTACT_PERSONS,
      beta: true,
      defaultEnabled: false,
    },

    [OrgFeatureKey.PROJECTS]: { section: "COLLABORATION", defaultEnabled: true },
    [OrgFeatureKey.MY_TASKS]: { section: "COLLABORATION", defaultEnabled: true },
    [OrgFeatureKey.CHATS]: { section: "COLLABORATION", defaultEnabled: true },
    [OrgFeatureKey.PROTOCOLS]: {
      section: "COLLABORATION",
      defaultEnabled: true,
    },
  };

export const ORG_FEATURE_KEYS: OrgFeatureKey[] = Object.values(OrgFeatureKey);
