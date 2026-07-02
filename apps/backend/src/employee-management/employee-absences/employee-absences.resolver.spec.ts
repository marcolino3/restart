import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeAbsencesResolver } from './employee-absences.resolver';
import { EmployeeAbsencesService } from './employee-absences.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { MembershipGuard } from '@/auth/guard/membership.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';

describe('EmployeeAbsencesResolver', () => {
  let resolver: EmployeeAbsencesResolver;
  let service: { createEmployeeAbsenceNotice: jest.Mock };

  beforeEach(async () => {
    service = { createEmployeeAbsenceNotice: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsencesResolver,
        { provide: EmployeeAbsencesService, useValue: service },
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

  it('delegates to the service with the caller identity (self-service only)', async () => {
    const user = {
      sub: 'user-1',
      orgId: 'org-1',
      membershipId: 'membership-1',
      isSuperAdmin: false,
    } as unknown as TokenPayload;
    const input = {
      startDate: '2026-07-01',
      absenceCategoryId: 'b6f2f2a0-0000-4000-8000-000000000000',
      note: 'sick',
      isTeamInformed: true,
    } as CreateEmployeeAbsenceNoticeInput;

    await resolver.createEmployeeAbsenceNotice(input, user);

    expect(service.createEmployeeAbsenceNotice).toHaveBeenCalledWith(
      input,
      user,
    );
  });
});
