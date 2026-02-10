// src/permissions/seeds/permission-catalog.seeder.ts
import { EntityManager } from 'typeorm';
import { Permission } from '@/permissions/entities/permission.entity';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';

const PERMISSION_CATALOG: Array<{
  code: PermissionCode;
  name: string;
  description?: string; // optional, kein null noetig
}> = [
  { code: PermissionCode.ORG_DELETE, name: 'Organisation loeschen' },
  { code: PermissionCode.ORG_TRANSFER_OWNERSHIP, name: 'Eigentum uebertragen' },
  { code: PermissionCode.BILLING_MANAGE, name: 'Abrechnung verwalten' },
  { code: PermissionCode.USER_INVITE, name: 'Benutzer einladen' },
  { code: PermissionCode.USER_REMOVE, name: 'Benutzer entfernen' },
  { code: PermissionCode.ROLE_CREATE, name: 'Rolle erstellen' },
  { code: PermissionCode.ROLE_DELETE, name: 'Rolle loeschen' },
  { code: PermissionCode.ROLE_ASSIGN, name: 'Rollen zuweisen' },
  { code: PermissionCode.TEAM_CREATE, name: 'Team erstellen' },
  { code: PermissionCode.TEAM_DELETE, name: 'Team loeschen' },
  { code: PermissionCode.TEAM_MANAGE, name: 'Team verwalten' },
  { code: PermissionCode.EMPLOYEE_READ, name: 'Mitarbeiter lesen' },
  { code: PermissionCode.EMPLOYEE_WRITE, name: 'Mitarbeiter schreiben' },
  { code: PermissionCode.TIMESHEET_READ, name: 'Stundenzettel lesen' },
  { code: PermissionCode.TIMESHEET_WRITE, name: 'Stundenzettel schreiben' },
];

export async function seedPermissionCatalog(manager: EntityManager) {
  await manager.getRepository(Permission).upsert(
    PERMISSION_CATALOG.map((p) => ({
      code: p.code,
      name: p.name,
      // description nur setzen, wenn vorhanden (keine nulls pushen)
      ...(p.description ? { description: p.description } : {}),
    })),
    ['code'],
  );
}
