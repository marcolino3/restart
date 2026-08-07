import { WorkTimeSimulationService } from './work-time-simulation.service';
import { BalanceInputLoaderService } from './balance-input-loader.service';
import { TimeTrackingAccessService } from './time-tracking-access.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

describe('WorkTimeSimulationService', () => {
  const user: TokenPayload = { sub: 'u1', orgId: 'org-1' };
  const employeeId = 'emp-1';

  let inputLoader: { loadCalcInput: jest.Mock };
  let openingBalanceRepo: { createQueryBuilder: jest.Mock };
  let access: { assertCanViewEmployee: jest.Mock };
  let service: WorkTimeSimulationService;

  const qbMock = (result: { min: number } | undefined) => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(result),
  });

  beforeEach(() => {
    inputLoader = { loadCalcInput: jest.fn() };
    openingBalanceRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qbMock(undefined)),
    };
    access = { assertCanViewEmployee: jest.fn().mockResolvedValue(undefined) };

    service = new WorkTimeSimulationService(
      inputLoader as unknown as BalanceInputLoaderService,
      openingBalanceRepo as any,
      access as unknown as TimeTrackingAccessService,
    );
  });

  it('checks view access before simulating', async () => {
    inputLoader.loadCalcInput.mockResolvedValue({
      rangeStart: '2026-01-01',
      rangeEnd: '2026-01-01',
      contracts: [],
      holidays: [],
      absenceDays: [],
      vacationDays: [],
      workEntries: [],
    });

    await service.simulate(user, employeeId, '2026-01-01', '2026-01-01');

    expect(access.assertCanViewEmployee).toHaveBeenCalledWith(user, employeeId);
  });

  it('does not touch the ledger — aggregates purely from calculateDays output', async () => {
    // Monday, full-time contract, no work entry → plannedMinutes > 0, differenceMinutes < 0.
    inputLoader.loadCalcInput.mockResolvedValue({
      rangeStart: '2026-01-05',
      rangeEnd: '2026-01-05',
      contracts: [
        {
          id: 'c1',
          startDate: '2026-01-01',
          endDate: null,
          weeklyHours: 42,
          workloadPercent: 100,
          weekdayWorkloads: null,
          weekdayTimeWindows: null,
        },
      ],
      holidays: [],
      absenceDays: [],
      vacationDays: [],
      workEntries: [],
    });

    const result = await service.simulate(
      user,
      employeeId,
      '2026-01-05',
      '2026-01-05',
    );

    expect(result.plannedMinutes).toBeGreaterThan(0);
    expect(result.workedMinutes).toBe(0);
    expect(result.differenceMinutes).toBe(-result.plannedMinutes);
    expect(result.paidOvertimeMinutes).toBe(0);
    expect(result.netBalanceMinutes).toBe(result.differenceMinutes);
  });

  it('passes contractEndDateOverride through to the loader for ad-hoc range preview', async () => {
    inputLoader.loadCalcInput.mockResolvedValue({
      rangeStart: '2026-01-01',
      rangeEnd: '2026-12-31',
      contracts: [],
      holidays: [],
      absenceDays: [],
      vacationDays: [],
      workEntries: [],
    });

    await service.simulate(user, employeeId, '2026-01-01', '2026-12-31', {
      contractEndDateOverride: '2026-06-30',
    });

    expect(inputLoader.loadCalcInput).toHaveBeenCalledWith(
      'org-1',
      employeeId,
      '2026-01-01',
      '2026-12-31',
      { contractEndDateOverride: '2026-06-30' },
    );
  });

  it('adds the opening balance of the period starting exactly at `from`', async () => {
    openingBalanceRepo.createQueryBuilder.mockReturnValue(qbMock({ min: 120 }));
    inputLoader.loadCalcInput.mockResolvedValue({
      rangeStart: '2026-01-01',
      rangeEnd: '2026-01-01',
      contracts: [],
      holidays: [],
      absenceDays: [],
      vacationDays: [],
      workEntries: [],
    });

    const result = await service.simulate(
      user,
      employeeId,
      '2026-01-01',
      '2026-01-01',
    );

    expect(result.openingWorkMinutes).toBe(120);
    expect(result.netBalanceMinutes).toBe(result.differenceMinutes + 120);
  });
});
