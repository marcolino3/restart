import { EntityManager } from 'typeorm';
import { SystemRole } from '../entities/system-role.enum';
import { Role } from '../entities/role.entity';

const ORG_SYSTEM_ROLES: SystemRole[] = [
  SystemRole.ORG_OWNER,
  SystemRole.ORG_ADMIN,
  SystemRole.HR_MANAGER,
  SystemRole.OFFICE,
  SystemRole.TEAM_LEAD,
  SystemRole.EMPLOYEE,
];

export async function seedOrgSystemRoles(
  manager: EntityManager,
  organizationId: string,
) {
  await manager.getRepository(Role).upsert(
    ORG_SYSTEM_ROLES.map((code) => ({
      name: code,
      organizationId,
      isSystem: true,
      systemCode: code,
    })),
    ['organizationId', 'name'],
  );
}
