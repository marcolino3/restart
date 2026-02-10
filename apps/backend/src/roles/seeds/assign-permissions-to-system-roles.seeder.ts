// roles/seeds/assign-permissions-to-system-roles.seeder.ts
import { EntityManager, In } from 'typeorm';
import { Role } from '@/roles/entities/role.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { SystemRole } from '../entities/system-role.enum';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';

const MATRIX: Record<SystemRole, PermissionCode[]> = {
  ORG_OWNER: [
    'ORG_DELETE',
    'ORG_TRANSFER_OWNERSHIP',
    'BILLING_MANAGE',
    'USER_INVITE',
    'USER_REMOVE',
    'ROLE_CREATE',
    'ROLE_DELETE',
    'ROLE_ASSIGN',
    'TEAM_CREATE',
    'TEAM_DELETE',
    'TEAM_MANAGE',
    'EMPLOYEE_READ',
    'EMPLOYEE_WRITE',
    'TIMESHEET_READ',
    'TIMESHEET_WRITE',
  ] as PermissionCode[],
  ORG_ADMIN: [
    'USER_INVITE',
    'USER_REMOVE',
    'ROLE_CREATE',
    'ROLE_ASSIGN',
    'TEAM_CREATE',
    'TEAM_DELETE',
    'TEAM_MANAGE',
    'EMPLOYEE_READ',
    'EMPLOYEE_WRITE',
    'TIMESHEET_READ',
    'TIMESHEET_WRITE',
  ] as PermissionCode[],
  HR_MANAGER: [
    'EMPLOYEE_READ',
    'EMPLOYEE_WRITE',
    'TIMESHEET_READ',
    'TIMESHEET_WRITE',
  ] as PermissionCode[],
  OFFICE: [
    'EMPLOYEE_READ',
    'TIMESHEET_READ',
    'TIMESHEET_WRITE',
  ] as PermissionCode[],
  TEAM_LEAD: [
    'EMPLOYEE_READ',
    'TIMESHEET_READ',
    'TIMESHEET_WRITE',
    'TEAM_MANAGE',
  ] as PermissionCode[],
  EMPLOYEE: [
    'EMPLOYEE_READ',
    'TIMESHEET_READ',
    'TIMESHEET_WRITE',
  ] as PermissionCode[],
};

export async function assignPermissionsToOrgSystemRoles(
  m: EntityManager,
  organizationId: string,
) {
  const roles = await m.getRepository(Role).find({
    where: { organizationId, isSystem: true },
    select: ['id', 'systemCode'], // reicht fuer die Zuordnung
  });
  if (!roles.length) return;

  const allCodes = Array.from(new Set(Object.values(MATRIX).flat()));
  const perms = await m
    .getRepository(Permission)
    .find({ where: { code: In(allCodes) } });
  const permByCode = new Map(perms.map((p) => [p.code, p.id]));

  for (const role of roles) {
    const codes = role['systemCode'] ? (MATRIX[role['systemCode']] ?? []) : [];
    const permIds = codes
      .map((c) => permByCode.get(c))
      .filter(Boolean) as string[];
    if (!permIds.length) continue;

    await m
      .createQueryBuilder()
      .relation(Role, 'permissions')
      .of(role.id)
      .add(permIds); // idempotent: keine Duplikate
  }
}
