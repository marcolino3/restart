/**
 * Zentrale Sichtbarkeitsregeln für die Sidebar-Navigation. Reine Funktionen,
 * damit Server-Pages (z.B. Zeitauswertung) und die Client-Sidebar dieselbe
 * Logik teilen. Die Backend-Guards bleiben die eigentliche Zugriffskontrolle —
 * hier geht es nur darum, was im Menü erscheint.
 */
export type NavVisibilityUser =
  | {
      isSuperAdmin?: boolean;
      roles?: string[];
      permissions?: string[];
      timeTrackingEnabled?: boolean;
      isProjectMember?: boolean;
      enabledFeatures?: string[];
    }
  | null
  | undefined;

// Zeiterfassung: nur wenn das Feature am eigenen Employee-Datensatz aktiviert ist
// UND das Org-Feature-Toggle nicht deaktiviert wurde.
export function canSeeTimeTracking(user: NavVisibilityUser): boolean {
  return user?.timeTrackingEnabled === true && hasOrgFeature(user, "TIME_TRACKING");
}

// Org-weites Feature-Toggle (SuperAdmin-verwaltet). Spiegelt OrgFeatureGuard
// im Backend: SuperAdmin sieht den vollen Katalog unabhängig vom Toggle-Stand.
export function hasOrgFeature(user: NavVisibilityUser, featureKey: string): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.enabledFeatures?.includes(featureKey) ?? false;
}

// Zeitauswertung: ORG_ADMIN/HR_MANAGER + Teamleiter (+ SuperAdmin). OFFICE ist
// — anders als im übrigen Admin-Bereich — bewusst ausgeschlossen (Spiegel der
// Backend-Logik in TimeTrackingAccessService).
const TIME_REPORT_ROLES: ReadonlySet<string> = new Set([
  "ORG_OWNER",
  "ORG_ADMIN",
  "HR_MANAGER",
]);

export function canSeeTimeReport(user: NavVisibilityUser): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.roles?.some((role) => TIME_REPORT_ROLES.has(role))) return true;
  return user.roles?.includes("TEAM_LEAD") ?? false;
}

// Projekte: Mitglied in mindestens einem Projekt ODER sieht ohnehin alle
// Projekte (SuperAdmin / PROJECT_MANAGE_ALL, analog canSeeAllProjects im Backend).
export function canSeeProjects(user: NavVisibilityUser): boolean {
  if (!hasOrgFeature(user, "PROJECTS")) return false;
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.permissions?.includes("PROJECT_MANAGE_ALL")) return true;
  return user.isProjectMember === true;
}

export function canSeeMyTasks(user: NavVisibilityUser): boolean {
  return hasOrgFeature(user, "MY_TASKS");
}

export function canSeeChats(user: NavVisibilityUser): boolean {
  return hasOrgFeature(user, "CHATS");
}

export function canSeeProtocols(user: NavVisibilityUser): boolean {
  return hasOrgFeature(user, "PROTOCOLS");
}
