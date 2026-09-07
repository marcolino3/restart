import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { protectedFieldKey } from '@restart/shared-schemas/rbac/field-catalog';

import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Persona } from '@/common/enums/persona.enum';
import {
  readWorkbook,
  toScalarString,
} from '@/common/spreadsheet/read-workbook';
import { hiddenByPermission } from '@/employee-management/employee-contracts/contract-field-permissions';
import { EmployeeContractsService } from '@/employee-management/employee-contracts/employee-contracts.service';
import {
  EmployeeContract,
  EmployeeContractType,
  EmployeePaymentInterval,
} from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import type { CreateEmployeeContractInput } from '@/employee-management/employee-contracts/dto/create-employee-contract.input';
import { EmployeeEmergencyService } from '@/employee-management/employee-emergency/employee-emergency.service';
import {
  BloodType,
  EmergencyContactRelationship,
} from '@/employee-management/employee-emergency/entities/employee-emergency-profile.entity';
import type { UpsertEmployeeEmergencyProfileInput } from '@/employee-management/employee-emergency/dto/upsert-employee-emergency-profile.input';
import { EmployeeHrProfilesService } from '@/employee-management/employee-hr-profiles/employee-hr-profiles.service';
import {
  EmployeeMaritalStatus,
  EmployeeOnboardingStatus,
  EmployeeResidencePermitType,
} from '@/employee-management/employee-hr-profiles/entities/employee-hr-profile.entity';
import type { UpsertEmployeeHrProfileInput } from '@/employee-management/employee-hr-profiles/dto/upsert-employee-hr-profile.input';
import { TeamMemberRole } from '@/employee-management/team-members/entities/team-member-role.enum';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';
import { User } from '@/users/entities/user.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import type { CreateEmployeeInput } from './dto/create-employee.input';
import type { UpdateEmployeeInput } from './dto/update-employee.input';
import {
  EMPLOYEE_IMPORT_COLUMN_BY_KEY,
  EMPLOYEE_IMPORT_MAX_ROWS,
  type EmployeeImportGroup,
} from './employee-import-columns';
import { EmployeesService } from './employees.service';

export interface EmployeeImportResult {
  created: { email: string; warnings?: string[] }[];
  /** Rows whose employee already existed in the org: filled cells overwrote. */
  updated: { email: string; warnings?: string[] }[];
  failed: { email: string; reason: string }[];
}

/** One spreadsheet row keyed by canonical column key (only non-empty cells). */
export type EmployeeImportRow = Record<string, string>;

export interface MappedEmployeeRow {
  employee: CreateEmployeeInput;
  /**
   * Same person fields for an employee that already exists in the org. Only
   * filled cells are present, so `updateEmployeeMinimal` leaves the rest
   * untouched (empty cell = keep, not clear).
   */
  personUpdate: Omit<UpdateEmployeeInput, 'id' | 'email'>;
  /** User/membership fields createEmployeeMinimal does not accept. */
  extras: { privateEmail?: string; contactPhone2?: string; language?: string };
  hr?: Omit<UpsertEmployeeHrProfileInput, 'employeeId'>;
  emergency?: Omit<UpsertEmployeeEmergencyProfileInput, 'employeeId'>;
  contract?: Omit<CreateEmployeeContractInput, 'employeeId'>;
  teamName?: string;
  teamRole?: TeamMemberRole;
  roleNames: string[];
}

export class EmployeeImportRowError extends Error {
  constructor(
    readonly column: string,
    message: string,
  ) {
    super(`${column}: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Pure value parsers (unit-tested)
// ---------------------------------------------------------------------------

const TRUE_VALUES = new Set(['true', '1', 'ja', 'yes', 'j', 'y', 'x']);
const FALSE_VALUES = new Set(['false', '0', 'nein', 'no', 'n', '']);

export function parseBoolean(column: string, raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (TRUE_VALUES.has(v)) return true;
  if (FALSE_VALUES.has(v)) return false;
  throw new EmployeeImportRowError(column, `invalid boolean "${raw}"`);
}

export function parseNumber(column: string, raw: string): number {
  const normalized = raw.trim().replace(/'/g, '').replace(',', '.');
  const n = Number(normalized);
  if (normalized === '' || !Number.isFinite(n)) {
    throw new EmployeeImportRowError(column, `invalid number "${raw}"`);
  }
  return n;
}

export function parseInteger(column: string, raw: string): number {
  const n = parseNumber(column, raw);
  if (!Number.isInteger(n)) {
    throw new EmployeeImportRowError(column, `expected whole number "${raw}"`);
  }
  return n;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CH_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/** Accepts YYYY-MM-DD (also Excel Date cells via toScalarString) and DD.MM.YYYY. */
export function parseDate(column: string, raw: string): string {
  const v = raw.trim();
  let iso: string | null = null;
  if (ISO_DATE.test(v)) iso = v;
  const ch = CH_DATE.exec(v);
  if (ch) {
    iso = `${ch[3]}-${ch[2].padStart(2, '0')}-${ch[1].padStart(2, '0')}`;
  }
  if (!iso || Number.isNaN(new Date(`${iso}T00:00:00Z`).getTime())) {
    throw new EmployeeImportRowError(
      column,
      `invalid date "${raw}" (expected YYYY-MM-DD)`,
    );
  }
  return iso;
}

export function parseEnum<T extends string>(
  column: string,
  raw: string,
  values: readonly T[],
): T {
  const v = raw
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  const match = values.find((candidate) => candidate === v);
  if (!match) {
    throw new EmployeeImportRowError(
      column,
      `invalid value "${raw}" (allowed: ${values.join(', ')})`,
    );
  }
  return match;
}

const enumValues = <T extends string>(e: Record<string, T>): readonly T[] =>
  Object.values(e);

// ---------------------------------------------------------------------------
// Header handling
// ---------------------------------------------------------------------------

export interface ParsedEmployeeSheet {
  /** Canonical column keys in sheet order. */
  columns: string[];
  rows: EmployeeImportRow[];
}

function normalizeHeader(value: unknown): string {
  return toScalarString(value)
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();
}

/**
 * Resolves the header row against the column catalog. Unknown columns are a
 * 400 (typo protection); protected columns the caller may not write are a
 * 403 — fail closed, same semantics as FieldWriteGuard on GraphQL.
 */
export function resolveColumns(
  headerRow: unknown[],
  user: TokenPayload,
): string[] {
  const columns: string[] = [];
  const unknown: string[] = [];
  const forbidden: string[] = [];
  const seen = new Set<string>();

  for (const cell of headerRow) {
    const norm = normalizeHeader(cell);
    if (!norm) {
      columns.push('');
      continue;
    }
    const column = EMPLOYEE_IMPORT_COLUMN_BY_KEY.get(norm);
    if (!column) {
      unknown.push(toScalarString(cell).trim());
      columns.push('');
      continue;
    }
    if (seen.has(column.key)) {
      throw new BadRequestException(`Duplicate column "${column.key}"`);
    }
    seen.add(column.key);
    if (column.protectedField && !user.isSuperAdmin) {
      const { resource, field, action } = column.protectedField;
      const key = protectedFieldKey(resource, field);
      if (!user.fieldPermissions?.get(key)?.has(action)) {
        forbidden.push(column.key);
      }
    }
    columns.push(column.key);
  }

  if (unknown.length > 0) {
    throw new BadRequestException(`Unknown columns: ${unknown.join(', ')}`);
  }
  if (forbidden.length > 0) {
    throw new ForbiddenException(
      `Access denied for columns: ${forbidden.join(', ')}`,
    );
  }
  if (!seen.has('email')) {
    throw new BadRequestException('Column "email" is required');
  }
  return columns;
}

export function parseEmployeeSheet(
  buffer: Buffer,
  filename: string,
  user: TokenPayload,
): ParsedEmployeeSheet {
  const sheet = readWorkbook(buffer, filename)[0];
  const allRows = sheet?.rows ?? [];
  const headerIndex = allRows.findIndex((r) =>
    r.some((c) => toScalarString(c).trim() !== ''),
  );
  if (headerIndex < 0) {
    throw new BadRequestException('File is empty or has no header row');
  }
  const columns = resolveColumns(allRows[headerIndex], user);

  const rows: EmployeeImportRow[] = [];
  for (const raw of allRows.slice(headerIndex + 1)) {
    const row: EmployeeImportRow = {};
    columns.forEach((key, i) => {
      if (!key) return;
      const value = toScalarString(raw[i]).trim();
      if (value !== '') row[key] = value;
    });
    if (Object.keys(row).length > 0) rows.push(row);
  }
  if (rows.length === 0) {
    throw new BadRequestException('File has no data rows');
  }
  if (rows.length > EMPLOYEE_IMPORT_MAX_ROWS) {
    throw new BadRequestException(
      `Too many rows (${rows.length}); maximum is ${EMPLOYEE_IMPORT_MAX_ROWS}`,
    );
  }
  return { columns: columns.filter(Boolean), rows };
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

const GROUP_KEYS: Record<EmployeeImportGroup, string[]> = {
  person: [],
  hr: [],
  emergency: [],
  contract: [],
  team: [],
};
for (const column of EMPLOYEE_IMPORT_COLUMN_BY_KEY.values()) {
  GROUP_KEYS[column.group].push(column.key);
}

function hasAny(row: EmployeeImportRow, group: EmployeeImportGroup): boolean {
  return GROUP_KEYS[group].some((key) => row[key] !== undefined);
}

function pick<T>(
  row: EmployeeImportRow,
  key: string,
  parse: (column: string, raw: string) => T,
): T | undefined {
  const raw = row[key];
  return raw === undefined ? undefined : parse(key, raw);
}

const str = (_column: string, raw: string): string => raw;

export function mapEmployeeRow(row: EmployeeImportRow): MappedEmployeeRow {
  const email = row.email?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new EmployeeImportRowError('email', 'valid email is required');
  }

  const persona = row.persona
    ? parseEnum('persona', row.persona, enumValues(Persona))
    : Persona.EMPLOYEE;

  const employee: CreateEmployeeInput = {
    email,
    firstName: row.firstName,
    lastName: row.lastName,
    title: row.title,
    persona,
    dateOfBirth: pick(row, 'dateOfBirth', parseDate),
    socialSecurityNumber: row.socialSecurityNumber,
    contactPhone: row.contactPhone,
    timeTrackingEnabled: pick(row, 'timeTrackingEnabled', parseBoolean),
    street: row.street,
    houseNumber: row.houseNumber,
    addressLine2: row.addressLine2,
    postalCode: row.postalCode,
    city: row.city,
    country: row.country,
  };

  const { email: _email, persona: _persona, ...personFields } = employee;
  const mapped: MappedEmployeeRow = {
    employee,
    // Persona only overwrites when the cell is filled; the create default
    // (EMPLOYEE) must not downgrade an existing member.
    personUpdate: {
      ...personFields,
      ...(row.persona ? { persona } : {}),
    },
    extras: {
      privateEmail: row.privateEmail?.toLowerCase(),
      contactPhone2: row.contactPhone2,
      language: row.language?.toLowerCase(),
    },
    roleNames: (row.roleNames ?? '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean),
  };

  if (hasAny(row, 'hr')) {
    mapped.hr = {
      iban: row.iban,
      bankAccountHolder: row.bankAccountHolder,
      bankName: row.bankName,
      bvgInsuranceNumber: row.bvgInsuranceNumber,
      withholdingTaxCode: row.withholdingTaxCode,
      nationality: row.nationality,
      residencePermitType: pick(row, 'residencePermitType', (c, v) =>
        parseEnum(c, v, enumValues(EmployeeResidencePermitType)),
      ),
      residencePermitValidUntil: pick(
        row,
        'residencePermitValidUntil',
        parseDate,
      ),
      maritalStatus: pick(row, 'maritalStatus', (c, v) =>
        parseEnum(c, v, enumValues(EmployeeMaritalStatus)),
      ),
      denomination: row.denomination,
      numberOfChildren: pick(row, 'numberOfChildren', parseInteger),
      onboardingStatus: pick(row, 'onboardingStatus', (c, v) =>
        parseEnum(c, v, enumValues(EmployeeOnboardingStatus)),
      ),
      ndaSigned: pick(row, 'ndaSigned', parseBoolean),
      criminalRecordSubmitted: pick(
        row,
        'criminalRecordSubmitted',
        parseBoolean,
      ),
    };
  }

  if (hasAny(row, 'emergency')) {
    const relationship = (c: string, v: string) =>
      parseEnum(c, v, enumValues(EmergencyContactRelationship));
    mapped.emergency = {
      contact1Name: row.contact1Name,
      contact1Relationship: pick(row, 'contact1Relationship', relationship),
      contact1Phone: row.contact1Phone,
      contact1Email: pick(row, 'contact1Email', str)?.toLowerCase(),
      contact2Name: row.contact2Name,
      contact2Relationship: pick(row, 'contact2Relationship', relationship),
      contact2Phone: row.contact2Phone,
      contact2Email: pick(row, 'contact2Email', str)?.toLowerCase(),
      bloodType: pick(row, 'bloodType', (c, v) =>
        parseEnum(c, v, enumValues(BloodType)),
      ),
      allergies: row.allergies,
      chronicConditions: row.chronicConditions,
      emergencyMedications: row.emergencyMedications,
      primaryDoctorName: row.primaryDoctorName,
      primaryDoctorPhone: row.primaryDoctorPhone,
      pharmacyName: row.pharmacyName,
    };
  }

  if (hasAny(row, 'contract')) {
    if (!row.contractStartDate) {
      throw new EmployeeImportRowError(
        'contractStartDate',
        'required when contract columns are filled',
      );
    }
    mapped.contract = {
      startDate: parseDate('contractStartDate', row.contractStartDate),
      endDate: pick(row, 'contractEndDate', parseDate),
      probationEndDate: pick(row, 'probationEndDate', parseDate),
      contractType: pick(row, 'contractType', (c, v) =>
        parseEnum(c, v, enumValues(EmployeeContractType)),
      ),
      position: row.position,
      workloadPercent: pick(row, 'workloadPercent', parseNumber),
      weeklyHours: pick(row, 'weeklyHours', (c, v) =>
        String(parseNumber(c, v)),
      ),
      grossSalary: pick(row, 'grossSalary', parseNumber),
      hourlyRate: pick(row, 'hourlyRate', parseNumber),
      paymentInterval: pick(row, 'paymentInterval', (c, v) =>
        parseEnum(c, v, enumValues(EmployeePaymentInterval)),
      ),
      has13thSalary: pick(row, 'has13thSalary', parseBoolean),
      annualVacationDays: pick(row, 'annualVacationDays', parseNumber),
      remainingVacationDays: pick(row, 'remainingVacationDays', (c, v) =>
        String(parseNumber(c, v)),
      ),
      notes: row.contractNotes,
    };
  }

  if (row.teamName) mapped.teamName = row.teamName;
  if (row.teamRole) {
    mapped.teamRole = parseEnum(
      'teamRole',
      row.teamRole,
      enumValues(TeamMemberRole),
    );
  }
  return mapped;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

@Injectable()
export class EmployeeImportService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly employeesService: EmployeesService,
    private readonly hrProfilesService: EmployeeHrProfilesService,
    private readonly emergencyService: EmployeeEmergencyService,
    private readonly contractsService: EmployeeContractsService,
  ) {}

  async importFile(
    buffer: Buffer,
    filename: string,
    orgId: string,
    user: TokenPayload,
  ): Promise<EmployeeImportResult> {
    const { rows } = parseEmployeeSheet(buffer, filename, user);
    return this.importRows(rows, orgId, user);
  }

  async importRows(
    rows: EmployeeImportRow[],
    orgId: string,
    user: TokenPayload,
  ): Promise<EmployeeImportResult> {
    const result: EmployeeImportResult = {
      created: [],
      updated: [],
      failed: [],
    };
    const contractHidden = hiddenByPermission(user);

    for (const row of rows) {
      const email = row.email?.trim().toLowerCase() || '(empty)';
      let mapped: MappedEmployeeRow;
      try {
        mapped = mapEmployeeRow(row);
      } catch (err) {
        result.failed.push({ email, reason: errorMessage(err) });
        continue;
      }

      // Step 1: person + address — the only step that fails the whole row.
      // An employee that already exists in this org is updated in place;
      // a known account without employee record in this org gets one.
      const existingUser = await this.entityManager.findOne(UserEmail, {
        where: { email: mapped.employee.email },
        select: { id: true, userId: true },
      });
      const existingMembership = existingUser
        ? await this.entityManager.findOne(Membership, {
            where: { organizationId: orgId, userId: existingUser.userId },
            select: { id: true, employeeId: true },
          })
        : null;
      const existingEmployeeId = existingMembership?.employeeId ?? null;
      const isUpdate = existingEmployeeId !== null;

      let employeeId: string;
      let membershipId: string | undefined;
      let userId: string | undefined;
      try {
        const employee = existingEmployeeId
          ? await this.employeesService.updateEmployeeMinimal(
              { id: existingEmployeeId, ...mapped.personUpdate },
              orgId,
              user.membershipId,
            )
          : await this.employeesService.createEmployeeMinimal(
              mapped.employee,
              orgId,
            );
        employeeId = employee.id;
        membershipId = employee.membership?.id;
        userId = employee.membership?.userId ?? employee.membership?.user?.id;
      } catch (err) {
        result.failed.push({ email, reason: errorMessage(err) });
        continue;
      }

      const warnings: string[] = [];
      const step = async (label: string, fn: () => Promise<unknown>) => {
        try {
          await fn();
        } catch (err) {
          warnings.push(`${label}: ${errorMessage(err)}`);
        }
      };

      // Step 2: user/membership fields createEmployeeMinimal does not cover.
      await step('person', () =>
        this.applyExtras(
          mapped,
          membershipId,
          existingUser ? undefined : userId,
        ),
      );

      // Step 3/4: HR + emergency profiles.
      if (mapped.hr) {
        const hr = mapped.hr;
        await step('hrProfile', () =>
          this.hrProfilesService.upsert(
            { employeeId, ...hr },
            orgId,
            user.membershipId,
          ),
        );
      }
      if (mapped.emergency) {
        const emergency = mapped.emergency;
        await step('emergencyProfile', () =>
          this.emergencyService.upsert(
            { employeeId, ...emergency },
            orgId,
            user.membershipId,
          ),
        );
      }

      // Step 5: first contract. On re-import a contract with the same start
      // date already exists and stays as it is (contracts are not overwritten).
      if (mapped.contract) {
        const contract = mapped.contract;
        await step('contract', async () => {
          if (isUpdate) {
            const existingContract = await this.entityManager.findOne(
              EmployeeContract,
              {
                where: {
                  employeeId,
                  organizationId: orgId,
                  startDate: contract.startDate,
                  isActive: true,
                },
                select: { id: true },
              },
            );
            if (existingContract) return;
          }
          await this.contractsService.create(
            { employeeId, ...contract },
            orgId,
            contractHidden,
          );
        });
      }

      // Step 6: team + roles (looked up by name within the org only).
      if (mapped.teamName) {
        await step('team', () =>
          this.assignTeam(
            employeeId,
            orgId,
            mapped.teamName as string,
            mapped.teamRole,
          ),
        );
      }
      if (mapped.roleNames.length > 0 && membershipId) {
        await step('roles', () =>
          this.assignRoles(membershipId, orgId, mapped.roleNames),
        );
      }

      (isUpdate ? result.updated : result.created).push(
        warnings.length > 0 ? { email, warnings } : { email },
      );
    }
    return result;
  }

  private async applyExtras(
    mapped: MappedEmployeeRow,
    membershipId: string | undefined,
    /** Set only when the user account was created by this import row. */
    newUserId: string | undefined,
  ): Promise<void> {
    const { privateEmail, contactPhone2, language } = mapped.extras;
    // An existing account keeps its own private email and language.
    if (newUserId && (privateEmail || language)) {
      await this.entityManager.update(
        User,
        { id: newUserId },
        {
          ...(privateEmail && { privateEmail }),
          ...(language && { language }),
        },
      );
    }
    if (membershipId && (contactPhone2 || language)) {
      await this.entityManager.update(
        Membership,
        { id: membershipId },
        {
          ...(contactPhone2 && { contactPhone2 }),
          ...(language && { language }),
        },
      );
    }
  }

  private async assignTeam(
    employeeId: string,
    orgId: string,
    teamName: string,
    role?: TeamMemberRole,
  ): Promise<void> {
    const team = await this.entityManager.findOne(Team, {
      where: { organizationId: orgId, name: teamName },
      select: { id: true },
    });
    if (!team) throw new Error(`team "${teamName}" not found`);
    const existing = await this.entityManager.findOne(TeamMember, {
      where: { teamId: team.id, employeeId },
      select: { id: true, role: true },
    });
    if (existing) {
      if (role && existing.role !== role) {
        await this.entityManager.update(
          TeamMember,
          { id: existing.id },
          { role },
        );
      }
      return;
    }
    await this.entityManager.save(
      this.entityManager.create(TeamMember, {
        organizationId: orgId,
        teamId: team.id,
        employeeId,
        role: role ?? TeamMemberRole.MEMBER,
      }),
    );
  }

  private async assignRoles(
    membershipId: string,
    orgId: string,
    roleNames: string[],
  ): Promise<void> {
    const membership = await this.entityManager.findOne(Membership, {
      where: { id: membershipId, organizationId: orgId },
      relations: { roles: true },
    });
    if (!membership) throw new Error('membership not found');

    const roles: Role[] = [];
    const missing: string[] = [];
    for (const name of roleNames) {
      const role = await this.entityManager.findOne(Role, {
        where: { organizationId: orgId, name },
      });
      if (role) roles.push(role);
      else missing.push(name);
    }
    if (roles.length > 0) {
      const existingIds = new Set((membership.roles ?? []).map((r) => r.id));
      membership.roles = [
        ...(membership.roles ?? []),
        ...roles.filter((r) => !existingIds.has(r.id)),
      ];
      await this.entityManager.save(membership);
    }
    if (missing.length > 0) {
      throw new Error(`roles not found: ${missing.join(', ')}`);
    }
  }
}
