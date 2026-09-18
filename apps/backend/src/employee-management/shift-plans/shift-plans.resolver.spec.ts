import { Test, TestingModule } from '@nestjs/testing';
import { ShiftPlansResolver } from './shift-plans.resolver';
import { ShiftPlansService } from './shift-plans.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { ShiftPlanStatus } from './entities/shift-plan-enums';

const user = {
  orgId: 'org-1',
  membershipId: 'm1',
  roles: [],
} as unknown as TokenPayload;

describe('ShiftPlansResolver', () => {
  let resolver: ShiftPlansResolver;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      plannableTeams: jest.fn().mockResolvedValue([]),
      coverageForTeam: jest.fn().mockResolvedValue([]),
      setCoverage: jest.fn().mockResolvedValue([]),
      listPlans: jest.fn().mockResolvedValue([]),
      planDetail: jest.fn(),
      myAssignments: jest.fn().mockResolvedValue([]),
      createPlan: jest.fn(),
      setAssignments: jest.fn().mockResolvedValue([]),
      setStatus: jest.fn(),
      deletePlan: jest.fn().mockResolvedValue(true),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftPlansResolver,
        { provide: ShiftPlansService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();
    resolver = module.get(ShiftPlansResolver);
  });

  const permissionsOf = (method: keyof ShiftPlansResolver): string[] =>
    (Reflect.getMetadata(
      PERMS_KEY,
      (ShiftPlansResolver.prototype as unknown as Record<string, object>)[
        method
      ],
    ) as string[] | undefined) ?? [];

  it('guards every operation', () => {
    expect(permissionsOf('shiftPlanTeams')).toEqual(['SHIFT_PLAN_READ']);
    expect(permissionsOf('shiftCoverage')).toEqual(['SHIFT_PLAN_READ']);
    expect(permissionsOf('shiftPlans')).toEqual(['SHIFT_PLAN_READ']);
    expect(permissionsOf('shiftPlan')).toEqual(['SHIFT_PLAN_READ']);
    expect(permissionsOf('myShiftAssignments')).toEqual(['SHIFT_PLAN_READ']);
    expect(permissionsOf('setShiftCoverage')).toEqual(['SHIFT_MANAGE']);
    expect(permissionsOf('createShiftPlan')).toEqual(['SHIFT_PLAN_WRITE']);
    expect(permissionsOf('setShiftAssignments')).toEqual(['SHIFT_PLAN_WRITE']);
    expect(permissionsOf('publishShiftPlan')).toEqual(['SHIFT_PLAN_WRITE']);
    expect(permissionsOf('unpublishShiftPlan')).toEqual(['SHIFT_PLAN_WRITE']);
    expect(permissionsOf('deleteShiftPlan')).toEqual(['SHIFT_PLAN_WRITE']);
  });

  it('passes caller and org into the service (tenant scoping)', async () => {
    await resolver.shiftPlans(user, 'org-1', undefined);
    expect(service.listPlans).toHaveBeenCalledWith(user, 'org-1', null);
    await resolver.publishShiftPlan(user, 'org-1', 'p1');
    expect(service.setStatus).toHaveBeenCalledWith(
      user,
      'org-1',
      'p1',
      ShiftPlanStatus.PUBLISHED,
    );
    await resolver.setShiftCoverage('org-1', { teamId: 't1', rows: [] });
    expect(service.setCoverage).toHaveBeenCalledWith('org-1', {
      teamId: 't1',
      rows: [],
    });
  });
});
