// src/auth/utils/get-auth-context.util.ts
import { EntityManager } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';

import { User } from '@/users/entities/user.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Persona } from '@/common/enums/persona.enum';
import { RoleFieldPermission } from '@/roles/entities/role-field-permission.entity';
import {
  protectedFieldKey,
  type FieldAction,
} from '@restart/shared-schemas/rbac/field-catalog';

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

  // 4) Permissions ueber alle Rollen (distinct Codes)
  let permissions: string[] = [];
  if (roles.length) {
    const permRows = await em
      .createQueryBuilder(Permission, 'p')
      .innerJoin('role_permissions', 'rp', 'rp.permission_id = p.id')
      .where('rp.role_id IN (:...roleIds)', { roleIds: roles.map((r) => r.id) })
      .select('p.code', 'code')
      .getRawMany<{ code: string }>();
    permissions = Array.from(new Set(permRows.map((r) => r.code)));
  }

  // 5) Optional: Employee (1:1 zu Membership)
  let employee: Employee | null = null;

  if (membership?.employeeId) {
    employee = await em.findOneByOrFail(Employee, {
      id: membership.employeeId,
    });
  }

  // 6) Feld-Permissions ueber alle Rollen (distinct resource.field -> actions)
  const fieldPermissions = new Map<string, Set<FieldAction>>();
  if (roles.length) {
    const fieldRows = await em
      .createQueryBuilder(RoleFieldPermission, 'rfp')
      .where('rfp.roleId IN (:...roleIds)', {
        roleIds: roles.map((r) => r.id),
      })
      .getMany();

    for (const row of fieldRows) {
      const key = protectedFieldKey(row.resource, row.field);
      const existing = fieldPermissions.get(key) ?? new Set<FieldAction>();
      for (const action of row.actions) {
        existing.add(action);
      }
      fieldPermissions.set(key, existing);
    }
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
