// src/auth/utils/get-auth-context.util.ts
import { EntityManager } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';

import { User } from '@/users/entities/user.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';

export type AuthContext = {
  user: User;
  org: Organization;
  membership: Membership;
  roles: Role[];
  permissions: string[]; // Permission.code
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
  if (!membership) {
    throw new UnauthorizedException('No membership in this org');
  }

  // 3) Rollen der Membership (Owner-Seite ist Membership -> Join ueber membership_roles)
  const roles = await em
    .createQueryBuilder(Role, 'r')
    .innerJoin('membership_roles', 'mr', 'mr.role_id = r.id')
    .where('mr.membership_id = :mid', { mid: membership.id })
    .getMany();

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

  // 5) Teams der Membership (via TeamMember Join-Tabelle)
  //    Falls du eine TeamMember-Entity hast, kannst du auch ueber Repository gehen;
  //    hier direkt ueber die Join-Tabelle:
  // const teams = await em
  //   .createQueryBuilder(Team, 't')
  //   .innerJoin('team_members', 'tm', 'tm.team_id = t.id')
  //   .where('tm.membership_id = :mid', { mid: membership.id })
  //   .getMany();

  // 6) Optional: Employee (1:1 zu Membership)
  let employee: Employee | null = null;

  if (membership.employeeId) {
    employee = await em.findOneByOrFail(Employee, {
      id: membership.employeeId,
    });
  }

  return {
    user,
    org,
    membership,
    roles,
    permissions,
    // teams,
    employee: employee ?? null,
  };
}
