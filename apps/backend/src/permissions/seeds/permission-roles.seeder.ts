import { EntityManager } from 'typeorm';
import { Role } from '@/roles/entities/role.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SystemRole } from '@/roles/entities/system-role.enum';

const ORG_SYSTEM_ROLES: { code: SystemRole; description: string }[] = [
  {
    code: SystemRole.ORG_OWNER,
    description: 'Vollzugriff auf alle Org-Daten und Verwaltung',
  },
  {
    code: SystemRole.ORG_ADMIN,
    description: 'Verwaltung von Benutzern, Rollen und Einstellungen',
  },
  {
    code: SystemRole.HR_MANAGER,
    description: 'Mitarbeiter- und Personalverwaltung',
  },
  {
    code: SystemRole.OFFICE,
    description: 'Büroadministration und organisatorische Aufgaben',
  },
  {
    code: SystemRole.TEAM_LEAD,
    description: 'Leitung eines Teams mit erweiterten Rechten',
  },
  {
    code: SystemRole.EMPLOYEE,
    description: 'Standardmitarbeiter mit Basisrechten',
  },
];

export async function seedOrgSystemRoles(
  manager: EntityManager,
  organization: Organization,
) {
  await manager.getRepository(Role).upsert(
    ORG_SYSTEM_ROLES.map((role) =>
      manager.create(Role, {
        name: role.code,
        description: role.description,
        organizationId: organization.id,
        isSystem: true,
        systemCode: role.code,
      }),
    ),
    ['organizationId', 'systemCode'], // verhindert Duplikate pro Org
  );
}
