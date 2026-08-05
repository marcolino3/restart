import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeeAbsencesResolver } from './employee-absences.resolver';
import { EmployeeAbsencesService } from './employee-absences.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { MembershipGuard } from '@/auth/guard/membership.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';
import { CreateEmployeeAbsenceInput } from './dto/create-employee-absence.input';

describe('EmployeeAbsencesResolver', () => {
  let resolver: EmployeeAbsencesResolver;
  let employeeAbsencesService: {
    createEmployeeAbsenceNotice: jest.Mock;
    createEmployeeAbsence: jest.Mock;
    findAllByEmployeeId: jest.Mock;
    findOne: jest.Mock;
    updateEmployeeAbsence: jest.Mock;
    deleteEmployeeAbsence: jest.Mock;
  };

  const input = {
    startDate: '2026-07-01',
    endDate: '2026-07-03',
    absenceCategoryId: 'cat-1',
  } as CreateEmployeeAbsenceNoticeInput;

  const user: TokenPayload = {
    sub: 'user-1',
    orgId: 'org-1',
    membershipId: 'mem-1',
  };

  beforeEach(async () => {
    employeeAbsencesService = {
      createEmployeeAbsenceNotice: jest.fn(),
      createEmployeeAbsence: jest.fn(),
      findAllByEmployeeId: jest.fn(),
      findOne: jest.fn(),
      updateEmployeeAbsence: jest.fn(),
      deleteEmployeeAbsence: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsencesResolver,
        { provide: EmployeeAbsencesService, useValue: employeeAbsencesService },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MembershipGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<EmployeeAbsencesResolver>(EmployeeAbsencesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('security metadata (regression: create had no membership requirement)', () => {
    it('authenticates the whole resolver', () => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', EmployeeAbsencesResolver) ?? [];
      expect(guards).toEqual(
        expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
      );
    });

    it('createEmployeeAbsenceNotice requires a verified org membership', () => {
      const handler = Object.getOwnPropertyDescriptor(
        EmployeeAbsencesResolver.prototype,
        'createEmployeeAbsenceNotice',
      )?.value as object;
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', handler) ?? [];
      expect(guards).toContain(MembershipGuard);
    });
  });

  describe('employeeAbsencesByEmployeeId', () => {
    it('delegates with employeeId and session user (multi-tenant via service)', async () => {
      const rows = [{ id: 'abs-1' }];
      employeeAbsencesService.findAllByEmployeeId.mockResolvedValue(rows);

      await expect(
        resolver.employeeAbsencesByEmployeeId('emp-1', user),
      ).resolves.toBe(rows);
      expect(employeeAbsencesService.findAllByEmployeeId).toHaveBeenCalledWith(
        'emp-1',
        user,
      );
    });
  });

  describe('createEmployeeAbsenceNotice', () => {
    it('delegates to the service with the input and the session token payload', async () => {
      const created = { id: 'abs-1' };
      employeeAbsencesService.createEmployeeAbsenceNotice.mockResolvedValue(
        created,
      );

      await expect(
        resolver.createEmployeeAbsenceNotice(input, user),
      ).resolves.toBe(created);
      expect(
        employeeAbsencesService.createEmployeeAbsenceNotice,
      ).toHaveBeenCalledWith(input, user);
    });

    it('forwards the active org id from the session so the service can scope org data (multi-tenant isolation)', async () => {
      employeeAbsencesService.createEmployeeAbsenceNotice.mockResolvedValue({
        id: 'abs-1',
      });

      await resolver.createEmployeeAbsenceNotice(input, user);

      const forwardedUser = employeeAbsencesService.createEmployeeAbsenceNotice
        .mock.calls[0][1] as TokenPayload;
      expect(forwardedUser.orgId).toBe('org-1');
      expect(forwardedUser.membershipId).toBe('mem-1');
    });

    it('propagates NotFoundException when the absence category belongs to a foreign org', async () => {
      employeeAbsencesService.createEmployeeAbsenceNotice.mockRejectedValue(
        new NotFoundException('Absenzcategory not found!'),
      );

      await expect(
        resolver.createEmployeeAbsenceNotice(input, user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createEmployeeAbsence', () => {
    it('delegates admin create with explicit employeeId', async () => {
      const adminInput = {
        ...input,
        employeeId: 'emp-1',
        note: 'Krankheit',
        isTeamInformed: true,
      } as CreateEmployeeAbsenceInput;
      const created = { id: 'abs-2' };
      employeeAbsencesService.createEmployeeAbsence.mockResolvedValue(created);

      await expect(
        resolver.createEmployeeAbsence(adminInput, user),
      ).resolves.toBe(created);
      expect(
        employeeAbsencesService.createEmployeeAbsence,
      ).toHaveBeenCalledWith(adminInput, user);
    });

    it('forwards labeled documents to the service', async () => {
      const adminInput = {
        ...input,
        employeeId: 'emp-1',
        certificates: [
          { url: '/api/absence-certificates/a.pdf', label: 'Erstattung' },
        ],
        additionalDocuments: [
          { url: '/api/absence-certificates/b.pdf', label: 'Unfall' },
        ],
      } as CreateEmployeeAbsenceInput;
      employeeAbsencesService.createEmployeeAbsence.mockResolvedValue({
        id: 'abs-3',
      });

      await resolver.createEmployeeAbsence(adminInput, user);

      expect(
        employeeAbsencesService.createEmployeeAbsence,
      ).toHaveBeenCalledWith(adminInput, user);
    });
  });

  describe('employeeAbsenceById', () => {
    it('delegates with id and session user', async () => {
      const row = { id: 'abs-1' };
      employeeAbsencesService.findOne.mockResolvedValue(row);

      await expect(resolver.employeeAbsenceById('abs-1', user)).resolves.toBe(
        row,
      );
      expect(employeeAbsencesService.findOne).toHaveBeenCalledWith(
        'abs-1',
        user,
      );
    });
  });

  describe('updateEmployeeAbsence', () => {
    it('delegates update to the service', async () => {
      const updated = { id: 'abs-1', note: 'updated' };
      employeeAbsencesService.updateEmployeeAbsence.mockResolvedValue(updated);

      await expect(
        resolver.updateEmployeeAbsence({ id: 'abs-1', note: 'updated' }, user),
      ).resolves.toBe(updated);
      expect(
        employeeAbsencesService.updateEmployeeAbsence,
      ).toHaveBeenCalledWith({ id: 'abs-1', note: 'updated' }, user);
    });
  });

  describe('deleteEmployeeAbsence', () => {
    it('delegates delete to the service', async () => {
      employeeAbsencesService.deleteEmployeeAbsence.mockResolvedValue(true);

      await expect(resolver.deleteEmployeeAbsence('abs-1', user)).resolves.toBe(
        true,
      );
      expect(
        employeeAbsencesService.deleteEmployeeAbsence,
      ).toHaveBeenCalledWith('abs-1', user);
    });
  });
});
