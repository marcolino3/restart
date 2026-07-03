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
  {
    code: PermissionCode.EMPLOYEE_ABSENCE_CATEGORY_READ,
    name: 'Absenzkategorien lesen',
  },
  {
    code: PermissionCode.EMPLOYEE_ABSENCE_CATEGORY_MANAGE,
    name: 'Absenzkategorien verwalten',
  },
  { code: PermissionCode.TIMESHEET_READ, name: 'Stundenzettel lesen' },
  { code: PermissionCode.TIMESHEET_WRITE, name: 'Stundenzettel schreiben' },
  { code: PermissionCode.SCHOOL_CLASS_READ, name: 'Schulklasse lesen' },
  { code: PermissionCode.SCHOOL_CLASS_WRITE, name: 'Schulklasse schreiben' },
  { code: PermissionCode.SCHOOL_CLASS_DELETE, name: 'Schulklasse loeschen' },
  { code: PermissionCode.CONTACT_PERSON_READ, name: 'Bezugsperson lesen' },
  { code: PermissionCode.CONTACT_PERSON_WRITE, name: 'Bezugsperson schreiben' },
  { code: PermissionCode.CONTACT_PERSON_DELETE, name: 'Bezugsperson loeschen' },
  { code: PermissionCode.ADMISSION_STAGE_READ, name: 'Aufnahmestufe lesen' },
  {
    code: PermissionCode.ADMISSION_STAGE_MANAGE,
    name: 'Aufnahmestufen verwalten',
  },
  {
    code: PermissionCode.ADMISSION_APPLICATION_READ,
    name: 'Aufnahme-Bewerbung lesen',
  },
  {
    code: PermissionCode.ADMISSION_APPLICATION_WRITE,
    name: 'Aufnahme-Bewerbung bearbeiten',
  },
  {
    code: PermissionCode.ADMISSION_APPLICATION_MOVE,
    name: 'Aufnahme-Bewerbung verschieben (Stage)',
  },
  {
    code: PermissionCode.ADMISSION_APPLICATION_ENROLL,
    name: 'Aufnahme finalisieren (Einschreibung)',
  },
  {
    code: PermissionCode.ADMISSION_APPLICATION_DELETE,
    name: 'Aufnahme-Bewerbung archivieren/ablehnen',
  },
  {
    code: PermissionCode.ADMISSION_EMAIL_TEMPLATE_MANAGE,
    name: 'Aufnahme-E-Mail-Vorlagen verwalten',
  },
  {
    code: PermissionCode.ADMISSION_EMAIL_SEND,
    name: 'Aufnahme-E-Mail versenden',
  },
  { code: PermissionCode.FAMILY_READ, name: 'Familie lesen' },
  { code: PermissionCode.FAMILY_WRITE, name: 'Familie bearbeiten' },
  {
    code: PermissionCode.CURRICULUM_LEVEL_READ,
    name: 'Curriculum-Stufe lesen',
  },
  {
    code: PermissionCode.CURRICULUM_LEVEL_MANAGE,
    name: 'Curriculum-Stufen verwalten',
  },
  { code: PermissionCode.CURRICULUM_READ, name: 'Curriculum lesen' },
  { code: PermissionCode.CURRICULUM_MANAGE, name: 'Curriculum verwalten' },
  {
    code: PermissionCode.RECORD_KEEPING_READ,
    name: 'Fortschritts-Eintraege lesen',
  },
  {
    code: PermissionCode.RECORD_KEEPING_WRITE,
    name: 'Fortschritts-Eintraege schreiben',
  },
  {
    code: PermissionCode.RECORD_KEEPING_SETTINGS_MANAGE,
    name: 'Aufmerksamkeits-Schwellen verwalten',
  },
  { code: PermissionCode.ADDRESS_READ, name: 'Adresse lesen' },
  { code: PermissionCode.ADDRESS_WRITE, name: 'Adresse schreiben' },
  { code: PermissionCode.ADDRESS_DELETE, name: 'Adresse loeschen' },
  { code: PermissionCode.PROJECT_READ, name: 'Projekte nutzen/lesen' },
  { code: PermissionCode.PROJECT_CREATE, name: 'Projekt erstellen' },
  {
    code: PermissionCode.PROJECT_MANAGE_ALL,
    name: 'Alle Projekte verwalten (org-weit)',
  },
  {
    code: PermissionCode.PROJECT_TEMPLATE_MANAGE,
    name: 'Projekt-Vorlagen verwalten',
  },
  { code: PermissionCode.PROTOCOL_READ, name: 'Protokolle lesen' },
  {
    code: PermissionCode.PROTOCOL_WRITE,
    name: 'Protokolle erstellen/bearbeiten',
  },
  { code: PermissionCode.PROTOCOL_DELETE, name: 'Protokolle loeschen' },
  { code: PermissionCode.CONSENT_READ, name: 'Einwilligungen lesen' },
  {
    code: PermissionCode.CONSENT_MANAGE,
    name: 'Einwilligungen erfassen/widerrufen',
  },
  {
    code: PermissionCode.CONSENT_SETTINGS_MANAGE,
    name: 'Einwilligungs-Zwecke verwalten',
  },
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
