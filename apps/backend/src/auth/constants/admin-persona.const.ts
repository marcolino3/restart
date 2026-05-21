import { Persona } from '@/common/enums/persona.enum';

// Personas allowed to access the org-admin area (sidebar navOrg block:
// teams, school classes, grade levels, curricula, role/permission management).
// All other personas (TEACHER, STUDENT, PARENT, EMPLOYEE) are blocked
// regardless of whatever permissions their roles happen to grant.
export const ADMIN_PERSONAS: ReadonlySet<Persona> = new Set<Persona>([
  Persona.ADMIN,
  Persona.HR,
  Persona.OFFICE,
]);

export function isAdminPersona(persona: Persona | undefined | null): boolean {
  return !!persona && ADMIN_PERSONAS.has(persona);
}

// Permission codes that may only be granted to / exercised by admin personas.
// Mirrors the "organization", "userManagement", and "teams" categories in
// apps/web/features/roles/permission-catalog.ts. Keep in sync.
export const ADMIN_ONLY_PERMISSION_CODES: ReadonlySet<string> = new Set<string>(
  [
    // organization
    'ORG_DELETE',
    'ORG_TRANSFER_OWNERSHIP',
    'BILLING_MANAGE',
    // userManagement
    'USER_INVITE',
    'USER_REMOVE',
    'ROLE_CREATE',
    'ROLE_DELETE',
    'ROLE_ASSIGN',
    // teams
    'TEAM_CREATE',
    'TEAM_DELETE',
    'TEAM_MANAGE',
  ],
);

export function requiresAdminPersona(permissionCodes: string[]): boolean {
  return permissionCodes.some((p) => ADMIN_ONLY_PERMISSION_CODES.has(p));
}
