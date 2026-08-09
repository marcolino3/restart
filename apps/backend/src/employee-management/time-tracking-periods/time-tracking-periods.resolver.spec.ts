import { Test, TestingModule } from '@nestjs/testing';

import { TimeTrackingPeriodsResolver } from './time-tracking-periods.resolver';
import { TimeTrackingPeriodsService } from './time-tracking-periods.service';
import { TimeTrackingPeriodStatus } from './entities/time-tracking-period.entity';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';

const methodOf = (name: keyof TimeTrackingPeriodsResolver): object =>
  Object.getOwnPropertyDescriptor(TimeTrackingPeriodsResolver.prototype, name)
    ?.value as object;

describe('TimeTrackingPeriodsResolver', () => {
  let resolver: TimeTrackingPeriodsResolver;
  let service: {
    findAll: jest.Mock;
    getAnchorValue: jest.Mock;
    setAnchorValue: jest.Mock;
    setStatus: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      getAnchorValue: jest.fn(),
      setAnchorValue: jest.fn(),
      setStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeTrackingPeriodsResolver,
        { provide: TimeTrackingPeriodsService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(TimeTrackingPeriodsResolver);
  });

  it('authenticates the whole resolver', () => {
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', TimeTrackingPeriodsResolver) ?? [];
    expect(guards).toEqual(
      expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
    );
  });

  it.each([
    ['periods', 'TIMESHEET_READ'],
    ['anchor', 'TIMESHEET_READ'],
    ['setTimeTrackingPeriodAnchor', 'EMPLOYEE_WRITE'],
    ['setTimeTrackingPeriodStatus', 'EMPLOYEE_WRITE'],
  ] as const)('%s requires permission %s', (method, permission) => {
    const permissions: string[] =
      Reflect.getMetadata(PERMS_KEY, methodOf(method)) ?? [];
    expect(permissions).toContain(permission);
  });

  it('scopes periods to the active org id (multi-tenant isolation)', async () => {
    service.findAll.mockResolvedValue([]);
    await resolver.periods('org-a');
    expect(service.findAll).toHaveBeenCalledWith('org-a');
  });

  it('scopes anchor to the active org id', async () => {
    service.getAnchorValue.mockResolvedValue('01-01');
    await resolver.anchor('org-a');
    expect(service.getAnchorValue).toHaveBeenCalledWith('org-a');
  });

  it('scopes setTimeTrackingPeriodAnchor to the active org id', async () => {
    service.setAnchorValue.mockResolvedValue('08-15');
    await resolver.setTimeTrackingPeriodAnchor('org-a', '08-15');
    expect(service.setAnchorValue).toHaveBeenCalledWith('org-a', '08-15');
  });

  it('scopes setTimeTrackingPeriodStatus to the active org id (multi-tenant isolation)', async () => {
    service.setStatus.mockResolvedValue({ id: 'period-1' });
    await resolver.setTimeTrackingPeriodStatus(
      'period-1',
      TimeTrackingPeriodStatus.LOCKED,
      'org-a',
    );
    expect(service.setStatus).toHaveBeenCalledWith(
      'period-1',
      'org-a',
      TimeTrackingPeriodStatus.LOCKED,
    );
  });

  it('propagates NotFoundException from the service for a foreign-org period id', async () => {
    const { NotFoundException } = await import('@nestjs/common');
    service.setStatus.mockRejectedValue(
      new NotFoundException('Period period-1 not found'),
    );

    await expect(
      resolver.setTimeTrackingPeriodStatus(
        'period-1',
        TimeTrackingPeriodStatus.LOCKED,
        'org-b',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
