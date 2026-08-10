// src/auth/utils/get-auth-context.util.ts
import { EntityManager } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';

import { User } from '@/users/entities/user.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Persona } from '@/common/enums/persona.enum';
import type { FieldAction } from '@restart/shared-schemas/rbac/field-catalog';
import {
  getOrgRoleCacheEntry,
  resolveFieldPermissionsForRoles,
  resolvePermissionsForRoles,
} from '@/auth/utils/role-permission-cache';

export type AuthContext = {
  user: User;
  org: Organization;
  membership: Membership;
  persona: Persona | null;
  roles: Role[];
  permissions: string[]; // Permission.code
  fieldPermissions: Map<string, Set<FieldAction>>; // key: "resource.field"
  // teams: Team[];
  employee: Employee | null;
};

export async function getAuthContext(
  em: EntityManager,
  userId: string,
  orgId: string,
): Promise<AuthContext> {
  // 1) Basis-Guards: User & Org muessen existieren
  const [user, org] = await Promise.all([
    em.findOneByOrFail(User, { id: userId }),
    em.findOneByOrFail(Organization, { id: orgId }),
  ]);

  // 2) Membership in der Org (ohne Relationen)
  const membership = await em.findOne(Membership, {
    where: { userId, organizationId: orgId },
  });

  // SuperAdmin darf ohne Membership auf eine Org zugreifen
  if (!membership && !user.isSuperAdmin) {
    throw new UnauthorizedException('No membership in this org');
  }

  // 3) Rollen der Membership (Owner-Seite ist Membership -> Join ueber membership_roles)
  let roles: Role[] = [];
  if (membership) {
    roles = await em
      .createQueryBuilder(Role, 'r')
      .innerJoin('membership_roles', 'mr', 'mr.role_id = r.id')
      .where('mr.membership_id = :mid', { mid: membership.id })
      .getMany();
  }

  // 4) Permissions + Feld-Permissions ueber alle Rollen, org-gecacht
  // (versioniert per MAX(roles.updated_at) — siehe role-permission-cache.ts)
  let permissions: string[] = [];
  let fieldPermissions = new Map<string, Set<FieldAction>>();
  if (roles.length) {
    const roleIds = roles.map((r) => r.id);
    const cacheEntry = await getOrgRoleCacheEntry(em, orgId);
    permissions = resolvePermissionsForRoles(cacheEntry, roleIds);
    fieldPermissions = resolveFieldPermissionsForRoles(cacheEntry, roleIds);
  }

  // 5) Optional: Employee (1:1 zu Membership)
  let employee: Employee | null = null;

  if (membership?.employeeId) {
    employee = await em.findOneByOrFail(Employee, {
      id: membership.employeeId,
    });
  }

  return {
    user,
    org,
    membership: membership ?? ({} as Membership),
    persona: membership?.persona ?? null,
    roles,
    permissions,
    fieldPermissions,
    employee: employee ?? null,
  };
}
