import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';

/**
 * Org-wide override for the membership-based visibility rule: platform
 * SuperAdmins and holders of PROJECT_MANAGE_ALL see/manage every project in the
 * organization. Everyone else is scoped to projects they belong to.
 */
export function canSeeAllProjects(user: TokenPayload | undefined): boolean {
  if (!user) return false;
  return (
    user.isSuperAdmin === true ||
    (user.permissions?.includes(PermissionCode.PROJECT_MANAGE_ALL) ?? false)
  );
}

/**
 * The acting membership id, or null when the session has none (e.g. a platform
 * SuperAdmin without an org membership). Read/manage paths tolerate null — a
 * `canSeeAll` caller is authorized regardless, and a non-member without a
 * membership simply sees nothing.
 */
export function actingMembershipId(
  user: TokenPayload | undefined,
): string | null {
  return user?.membershipId ?? null;
}
