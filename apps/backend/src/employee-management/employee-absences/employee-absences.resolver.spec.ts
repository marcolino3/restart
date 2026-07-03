import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeeAbsencesResolver } from './employee-absences.resolver';
import { EmployeeAbsencesService } from './employee-absences.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { MembershipGuard } from '@/auth/guard/membership.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';

describe('EmployeeAbsencesResolver', () => {
  let resolver: EmployeeAbsencesResolver;
  let employeeAbsencesService: { createEmployeeAbsenceNotice: jest.Mock };

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
});
