import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { protectedFieldKey } from '@restart/shared-schemas/rbac/field-catalog';

import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Persona } from '@/common/enums/persona.enum';
import { TeamMemberRole } from '@/employee-management/team-members/entities/team-member-role.enum';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';
import { User } from '@/users/entities/user.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import {
  EmployeeImportService,
  mapEmployeeRow,
  parseBoolean,
  parseDate,
  parseEmployeeSheet,
  parseEnum,
  parseNumber,
  resolveColumns,
} from './employee-import.service';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ORG_ID = '22222222-2222-4222-8222-222222222222';
const MEMBERSHIP_ID = '33333333-3333-4333-8333-333333333333';
const USER_ID = '44444444-4444-4444-8444-444444444444';

const superAdmin = {
  sub: 'sa',
  orgId: ORG_ID,
  membershipId: 'sa-membership',
  isSuperAdmin: true,
} as unknown as TokenPayload;

const withFieldPerms = (grants: [string, string, string][]): TokenPayload =>
  ({
    sub: 'u',
    orgId: ORG_ID,
    membershipId: MEMBERSHIP_ID,
    isSuperAdmin: false,
    fieldPermissions: new Map(
      grants.map(([resource, field, action]) => [
        protectedFieldKey(resource, field),
        new Set([action]),
      ]),
    ),
  }) as unknown as TokenPayload;

const csv = (lines: string[]): Buffer => Buffer.from(lines.join('\n'), 'utf8');

describe('employee import value parsers', () => {
  it('parses booleans in DE/EN spellings', () => {
    expect(parseBoolean('x', 'ja')).toBe(true);
    expect(parseBoolean('x', 'TRUE')).toBe(true);
    expect(parseBoolean('x', '0')).toBe(false);
    expect(parseBoolean('x', 'nein')).toBe(false);
    expect(() => parseBoolean('x', 'maybe')).toThrow('x: invalid boolean');
  });

  it('parses numbers with comma decimals and thousands apostrophes', () => {
    expect(parseNumber('x', '80,5')).toBe(80.5);
    expect(parseNumber('x', "6'500.00")).toBe(6500);
    expect(() => parseNumber('x', 'abc')).toThrow('x: invalid number');
  });

  it('parses ISO and Swiss dates', () => {
    expect(parseDate('x', '2025-01-15')).toBe('2025-01-15');
    expect(parseDate('x', '1.2.2025')).toBe('2025-02-01');
    expect(() => parseDate('x', '15/01/2025')).toThrow('x: invalid date');
  });

  it('parses enums case-insensitively and lists allowed values', () => {
    expect(parseEnum('x', 'married', ['SINGLE', 'MARRIED'])).toBe('MARRIED');
    expect(() => parseEnum('x', 'nope', ['SINGLE'])).toThrow(
      'x: invalid value "nope" (allowed: SINGLE)',
    );
  });
});

describe('resolveColumns', () => {
  it('matches headers case-insensitively and strips BOM', () => {
    expect(
      resolveColumns(['﻿Email', ' firstname ', 'LASTNAME'], superAdmin),
    ).toEqual(['email', 'firstName', 'lastName']);
  });

  it('rejects unknown columns with their names', () => {
    expect(() => resolveColumns(['email', 'foo', 'bar'], superAdmin)).toThrow(
      new BadRequestException('Unknown columns: foo, bar'),
    );
  });

  it('requires the email column', () => {
    expect(() => resolveColumns(['firstName'], superAdmin)).toThrow(
      BadRequestException,
    );
  });

  it('fails closed on protected columns without field permission', () => {
    const user = withFieldPerms([['employeeHrProfile', 'iban', 'read']]);
    expect(() =>
      resolveColumns(['email', 'iban', 'grossSalary', 'bloodType'], user),
    ).toThrow(
      new ForbiddenException(
        'Access denied for columns: iban, grossSalary, bloodType',
      ),
    );
  });

  it('allows protected columns with the matching action', () => {
    const user = withFieldPerms([
      ['employeeHrProfile', 'iban', 'update'],
      ['employeeContract', 'grossSalary', 'create'],
    ]);
    expect(resolveColumns(['email', 'iban', 'grossSalary'], user)).toEqual([
      'email',
      'iban',
      'grossSalary',
    ]);
  });

  it('exempts super admins from field permissions', () => {
    expect(resolveColumns(['email', 'iban'], superAdmin)).toEqual([
      'email',
      'iban',
    ]);
  });
});

describe('parseEmployeeSheet', () => {
  it('reads semicolon CSV with CRLF into keyed rows, skipping empty cells', () => {
    const { rows } = parseEmployeeSheet(
      csv(['email;firstName;lastName\r\n', 'a@x.ch;Anna;\r\n', ';;\r\n']),
      'x.csv',
      superAdmin,
    );
    expect(rows).toEqual([{ email: 'a@x.ch', firstName: 'Anna' }]);
  });

  it('rejects files without data rows', () => {
    expect(() =>
      parseEmployeeSheet(csv(['email;firstName']), 'x.csv', superAdmin),
    ).toThrow(BadRequestException);
  });
});

describe('mapEmployeeRow', () => {
  it('maps a full row into all target inputs', () => {
    const mapped = mapEmployeeRow({
      email: 'Max@Example.com',
      firstName: 'Max',
      lastName: 'Muster',
      persona: 'teacher',
      dateOfBirth: '1990-01-15',
      timeTrackingEnabled: 'ja',
      privateEmail: 'max@home.ch',
      contactPhone2: '+41 79 000 00 00',
      language: 'DE',
      iban: 'CH93 0076 2011 6238 5295 7',
      maritalStatus: 'married',
      numberOfChildren: '2',
      ndaSigned: 'true',
      contact1Name: 'Erika',
      contact1Relationship: 'spouse',
      bloodType: 'A_POS',
      contractStartDate: '2025-08-01',
      contractType: 'PERMANENT',
      workloadPercent: '80',
      weeklyHours: '33,6',
      grossSalary: "6'500",
      paymentInterval: 'MONTHLY_X12',
      has13thSalary: '1',
      remainingVacationDays: '12.5',
      contractNotes: 'note',
      teamName: 'Primar',
      teamRole: 'lead',
      roleNames: 'Lehrperson | Admin',
    });

    expect(mapped.employee).toMatchObject({
      email: 'max@example.com',
      firstName: 'Max',
      persona: Persona.TEACHER,
      dateOfBirth: '1990-01-15',
      timeTrackingEnabled: true,
    });
    expect(mapped.extras).toEqual({
      privateEmail: 'max@home.ch',
      contactPhone2: '+41 79 000 00 00',
      language: 'de',
    });
    expect(mapped.hr).toMatchObject({
      iban: 'CH93 0076 2011 6238 5295 7',
      maritalStatus: 'MARRIED',
      numberOfChildren: 2,
      ndaSigned: true,
    });
    expect(mapped.emergency).toMatchObject({
      contact1Name: 'Erika',
      contact1Relationship: 'SPOUSE',
      bloodType: 'A_POS',
    });
    expect(mapped.contract).toMatchObject({
      startDate: '2025-08-01',
      contractType: 'PERMANENT',
      workloadPercent: 80,
      weeklyHours: '33.6',
      grossSalary: 6500,
      paymentInterval: 'MONTHLY_X12',
      has13thSalary: true,
      remainingVacationDays: '12.5',
      notes: 'note',
    });
    expect(mapped.teamName).toBe('Primar');
    expect(mapped.teamRole).toBe(TeamMemberRole.LEAD);
    expect(mapped.roleNames).toEqual(['Lehrperson', 'Admin']);
  });

  it('leaves optional sections undefined when no column of the group is set', () => {
    const mapped = mapEmployeeRow({ email: 'a@x.ch' });
    expect(mapped.employee.persona).toBe(Persona.EMPLOYEE);
    expect(mapped.hr).toBeUndefined();
    expect(mapped.emergency).toBeUndefined();
    expect(mapped.contract).toBeUndefined();
    expect(mapped.roleNames).toEqual([]);
  });

  it('requires contractStartDate when any contract column is filled', () => {
    expect(() =>
      mapEmployeeRow({ email: 'a@x.ch', position: 'Teacher' }),
    ).toThrow('contractStartDate: required');
  });

  it('rejects invalid email and invalid enum values', () => {
    expect(() => mapEmployeeRow({ email: 'nope' })).toThrow('email:');
    expect(() => mapEmployeeRow({ email: 'a@x.ch', persona: 'KING' })).toThrow(
      'persona: invalid value',
    );
  });
});

describe('EmployeeImportService.importRows', () => {
  const employeesService = { createEmployeeMinimal: jest.fn() };
  const hrProfilesService = { upsert: jest.fn() };
  const emergencyService = { upsert: jest.fn() };
  const contractsService = { create: jest.fn() };
  const entityManager = {
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn((_: unknown, v: unknown) => v),
  };

  const service = new EmployeeImportService(
    entityManager as never,
    employeesService as never,
    hrProfilesService as never,
    emergencyService as never,
    contractsService as never,
  );

  const createdEmployee = {
    id: 'emp-1',
    membership: { id: MEMBERSHIP_ID, userId: USER_ID },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    employeesService.createEmployeeMinimal.mockResolvedValue(createdEmployee);
    entityManager.findOne.mockResolvedValue(null);
    entityManager.update.mockResolvedValue(undefined);
    entityManager.save.mockResolvedValue(undefined);
  });

  it('creates the employee and passes the actor org to every sub-service', async () => {
    const user = withFieldPerms([]);
    const result = await service.importRows(
      [
        {
          email: 'a@x.ch',
          firstName: 'A',
          lastName: 'B',
          language: 'de',
          onboardingStatus: 'COMPLETED',
          contact1Name: 'C',
          contractStartDate: '2025-01-01',
        },
      ],
      ORG_ID,
      user,
    );

    expect(result).toEqual({ created: [{ email: 'a@x.ch' }], failed: [] });
    expect(employeesService.createEmployeeMinimal).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@x.ch' }),
      ORG_ID,
    );
    expect(entityManager.update).toHaveBeenCalledWith(
      User,
      { id: USER_ID },
      { language: 'de' },
    );
    expect(entityManager.update).toHaveBeenCalledWith(
      Membership,
      { id: MEMBERSHIP_ID },
      { language: 'de' },
    );
    expect(hrProfilesService.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: 'emp-1',
        onboardingStatus: 'COMPLETED',
      }),
      ORG_ID,
      MEMBERSHIP_ID,
    );
    expect(emergencyService.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 'emp-1', contact1Name: 'C' }),
      ORG_ID,
      MEMBERSHIP_ID,
    );
    expect(contractsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 'emp-1', startDate: '2025-01-01' }),
      ORG_ID,
      expect.any(Set),
    );
  });

  it('does not touch an existing user account', async () => {
    entityManager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === UserEmail ? { id: 'ue-1' } : null),
    );
    await service.importRows(
      [{ email: 'a@x.ch', privateEmail: 'p@x.ch' }],
      ORG_ID,
      superAdmin,
    );
    expect(entityManager.update).not.toHaveBeenCalledWith(
      User,
      expect.anything(),
      expect.anything(),
    );
  });

  it('marks the row failed when the employee already exists', async () => {
    employeesService.createEmployeeMinimal.mockRejectedValue(
      new ConflictException('Employee already exists for this membership'),
    );
    const result = await service.importRows(
      [{ email: 'a@x.ch', contractStartDate: '2025-01-01' }],
      ORG_ID,
      superAdmin,
    );
    expect(result.failed).toEqual([
      {
        email: 'a@x.ch',
        reason: 'Employee already exists for this membership',
      },
    ]);
    expect(contractsService.create).not.toHaveBeenCalled();
  });

  it('keeps the employee and reports a warning when a sub-step fails', async () => {
    hrProfilesService.upsert.mockRejectedValue(new Error('IBAN invalid'));
    const result = await service.importRows(
      [{ email: 'a@x.ch', iban: 'x' }],
      ORG_ID,
      superAdmin,
    );
    expect(result.created).toEqual([
      { email: 'a@x.ch', warnings: ['hrProfile: IBAN invalid'] },
    ]);
  });

  it('reports mapping errors per row without calling services', async () => {
    const result = await service.importRows(
      [{ email: 'a@x.ch', dateOfBirth: 'yesterday' }],
      ORG_ID,
      superAdmin,
    );
    expect(result.failed[0].reason).toContain('dateOfBirth: invalid date');
    expect(employeesService.createEmployeeMinimal).not.toHaveBeenCalled();
  });

  it('looks up team and roles within the actor org only', async () => {
    entityManager.findOne.mockImplementation(
      (entity: unknown, opts: { where: Record<string, unknown> }) => {
        if (entity === Team) {
          return opts.where.organizationId === ORG_ID ? { id: 'team-1' } : null;
        }
        if (entity === Role) {
          return opts.where.organizationId === ORG_ID &&
            opts.where.name === 'Lehrperson'
            ? { id: 'role-1' }
            : null;
        }
        if (entity === Membership) {
          return opts.where.organizationId === ORG_ID
            ? { id: MEMBERSHIP_ID, roles: [] }
            : null;
        }
        return null;
      },
    );

    const result = await service.importRows(
      [
        {
          email: 'a@x.ch',
          teamName: 'Primar',
          teamRole: 'LEAD',
          roleNames: 'Lehrperson|Ghost',
        },
      ],
      ORG_ID,
      superAdmin,
    );

    expect(entityManager.findOne).toHaveBeenCalledWith(
      Team,
      expect.objectContaining({
        where: { organizationId: ORG_ID, name: 'Primar' },
      }),
    );
    expect(entityManager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG_ID,
        teamId: 'team-1',
        employeeId: 'emp-1',
        role: TeamMemberRole.LEAD,
      }),
    );
    expect(entityManager.create).toHaveBeenCalledWith(
      TeamMember,
      expect.anything(),
    );
    expect(entityManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ roles: [{ id: 'role-1' }] }),
    );
    expect(result.created).toEqual([
      { email: 'a@x.ch', warnings: ['roles: roles not found: Ghost'] },
    ]);
  });

  it('cannot resolve a team of another organization', async () => {
    entityManager.findOne.mockImplementation(
      (entity: unknown, opts: { where: Record<string, unknown> }) =>
        Promise.resolve(
          entity === Team && opts.where.organizationId === OTHER_ORG_ID
            ? { id: 'foreign-team' }
            : null,
        ),
    );
    const result = await service.importRows(
      [{ email: 'a@x.ch', teamName: 'Primar' }],
      ORG_ID,
      superAdmin,
    );
    expect(entityManager.save).not.toHaveBeenCalled();
    expect(result.created[0].warnings).toEqual([
      'team: team "Primar" not found',
    ]);
  });
});
