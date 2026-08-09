export const ADMIN_ROLES: ReadonlySet<string> = new Set([
  "ORG_OWNER",
  "ORG_ADMIN",
  "HR_MANAGER",
  "OFFICE",
]);

export function hasAdminRole(roles: string[] | null | undefined): boolean {
  if (!roles) return false;
  return roles.some((role) => ADMIN_ROLES.has(role));
}
