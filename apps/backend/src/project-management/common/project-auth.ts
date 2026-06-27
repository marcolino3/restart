import { ForbiddenException } from '@nestjs/common';
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

/** The acting membership id, or a Forbidden if the session has no membership. */
export function requireMembershipId(user: TokenPayload | undefined): string {
  if (!user?.membershipId) {
    throw new ForbiddenException('No active membership');
  }
  return user.membershipId;
}
