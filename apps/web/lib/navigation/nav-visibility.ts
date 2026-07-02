import type { Persona } from "@/features/users/lib/admin-persona";

/**
 * Zentrale Sichtbarkeitsregeln für die Sidebar-Navigation. Reine Funktionen,
 * damit Server-Pages (z.B. Zeitauswertung) und die Client-Sidebar dieselbe
 * Logik teilen. Die Backend-Guards bleiben die eigentliche Zugriffskontrolle —
 * hier geht es nur darum, was im Menü erscheint.
 */
export type NavVisibilityUser =
  | {
      isSuperAdmin?: boolean;
      persona?: Persona | null;
      roles?: string[];
      permissions?: string[];
      timeTrackingEnabled?: boolean;
      isProjectMember?: boolean;
    }
  | null
  | undefined;

// Zeiterfassung: nur wenn das Feature am eigenen Employee-Datensatz aktiviert ist.
export function canSeeTimeTracking(user: NavVisibilityUser): boolean {
  return user?.timeTrackingEnabled === true;
}

// Zeitauswertung: ADMIN/HR + Teamleiter (+ SuperAdmin). OFFICE ist — anders als
// im übrigen Admin-Bereich — bewusst ausgeschlossen (Spiegel der Backend-Logik
// in TimeTrackingAccessService).
const TIME_REPORT_PERSONAS: ReadonlySet<Persona> = new Set<Persona>([
  "ADMIN",
  "HR",
]);

export function canSeeTimeReport(user: NavVisibilityUser): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.persona && TIME_REPORT_PERSONAS.has(user.persona)) return true;
  return user.roles?.includes("TEAM_LEAD") ?? false;
}

// Projekte: Mitglied in mindestens einem Projekt ODER sieht ohnehin alle
// Projekte (SuperAdmin / PROJECT_MANAGE_ALL, analog canSeeAllProjects im Backend).
export function canSeeProjects(user: NavVisibilityUser): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.permissions?.includes("PROJECT_MANAGE_ALL")) return true;
  return user.isProjectMember === true;
}
