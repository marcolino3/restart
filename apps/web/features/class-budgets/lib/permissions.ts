type PermissionSubject = {
  permissions?: string[] | null;
  isSuperAdmin?: boolean | null;
};

/**
 * Server-side twin of `usePermissions().hasPermission`: a SuperAdmin passes
 * every check, everyone else needs the code. Only decides what a page shows —
 * the backend enforces the permission on every operation regardless.
 */
export const userHasPermission = (
  user: PermissionSubject | null | undefined,
  permission: string,
): boolean =>
  Boolean(user?.isSuperAdmin) ||
  (user?.permissions?.includes(permission) ?? false);
