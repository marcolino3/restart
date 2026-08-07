import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { WorkTimeBalanceResolver } from './work-time-balance.resolver';
import { WorkTimeBalanceService } from './work-time-balance.service';
import { WorkTimeSimulationService } from './work-time-simulation.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

describe('WorkTimeBalanceResolver', () => {
  let resolver: WorkTimeBalanceResolver;
  let balanceService: Record<string, jest.Mock>;
  let simulationService: Record<string, jest.Mock>;

  const user: TokenPayload = { sub: 'u1', orgId: 'org-1' };
  const from = '2026-01-01';
  const to = '2026-01-31';

  beforeEach(async () => {
    balanceService = {
      getMyBalance: jest.fn().mockResolvedValue({ id: 'balance' }),
      getMyVacationBalance: jest.fn().mockResolvedValue({ id: 'vacation' }),
      getEmployeeBalance: jest.fn().mockResolvedValue({ id: 'balance' }),
      getMonthlySummaries: jest.fn().mockResolvedValue([]),
      getVacationBalance: jest.fn().mockResolvedValue({ id: 'vacation' }),
      getMyMonthlyTimeTracking: jest.fn().mockResolvedValue([]),
      getMyMissingRecordDays: jest.fn().mockResolvedValue([]),
      getMissingRecordDays: jest.fn().mockResolvedValue([]),
      getAbsenceCategorySummaries: jest.fn().mockResolvedValue([]),
      getTeamOverview: jest.fn().mockResolvedValue([]),
    };
    simulationService = {
      simulate: jest.fn().mockResolvedValue({ id: 'simulated' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkTimeBalanceResolver,
        { provide: WorkTimeBalanceService, useValue: balanceService },
        { provide: WorkTimeSimulationService, useValue: simulationService },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<WorkTimeBalanceResolver>(WorkTimeBalanceResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('requires TIMESHEET_READ on every query (multi-tenant/permission gate)', () => {
    const reflector = new Reflector();
    const methods = [
      'myWorkTimeBalance',
      'myVacationBalance',
      'employeeWorkTimeBalance',
      'simulateEmployeeWorkTimeBalance',
      'employeeMonthlyWorkTime',
      'employeeVacationBalance',
      'myMonthlyTimeTracking',
      'myMissingRecordDays',
      'employeeMissingRecordDays',
      'employeeAbsenceCategorySummary',
      'teamWorkTimeOverview',
    ] as const;

    for (const method of methods) {
      const handler = Reflect.get(resolver, method) as (
        ...args: unknown[]
      ) => unknown;
      const permissions = reflector.get<string[]>(PERMS_KEY, handler);
      expect(permissions).toEqual(['TIMESHEET_READ']);
    }
  });

  it('myMonthlyTimeTracking delegates to getMyMonthlyTimeTracking scoped to the caller', async () => {
    await resolver.myMonthlyTimeTracking(user, from, to);
    expect(balanceService.getMyMonthlyTimeTracking).toHaveBeenCalledWith(
      user,
      from,
      to,
      'DE',
    );
  });

  it('employeeWorkTimeBalance delegates cross-employee reads to the access-scoped service method', async () => {
    await resolver.employeeWorkTimeBalance(user, 'emp-1', from, to);
    expect(balanceService.getEmployeeBalance).toHaveBeenCalledWith(
      user,
      'emp-1',
      from,
      to,
    );
  });

  it('simulateEmployeeWorkTimeBalance delegates to the simulation service with overrides', async () => {
    await resolver.simulateEmployeeWorkTimeBalance(
      user,
      'emp-1',
      from,
      to,
      '2026-01-15',
    );
    expect(simulationService.simulate).toHaveBeenCalledWith(
      user,
      'emp-1',
      from,
      to,
      { contractEndDateOverride: '2026-01-15' },
    );
  });

  it('employeeAbsenceCategorySummary defaults locale to DE when not provided', async () => {
    await resolver.employeeAbsenceCategorySummary(user, 'emp-1', from, to);
    expect(balanceService.getAbsenceCategorySummaries).toHaveBeenCalledWith(
      user,
      'emp-1',
      from,
      to,
      'DE',
    );
  });

  it('teamWorkTimeOverview delegates without an employeeId (service-side scope resolution)', async () => {
    await resolver.teamWorkTimeOverview(user, from, to);
    expect(balanceService.getTeamOverview).toHaveBeenCalledWith(user, from, to);
  });
});
