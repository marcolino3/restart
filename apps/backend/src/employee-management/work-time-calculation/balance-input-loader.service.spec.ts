import { BalanceInputLoaderService } from './balance-input-loader.service';

describe('BalanceInputLoaderService', () => {
  const orgId = 'org-1';
  const employeeId = 'emp-1';

  const baseContract = {
    id: 'c1',
    organizationId: orgId,
    employeeId,
    startDate: '2026-01-01',
    endDate: null as string | null,
    weeklyHours: '42',
    workloadPercent: '100',
    weekdayWorkloads: null,
    weekdayTimeWindows: null,
  };

  function makeService(contracts: (typeof baseContract)[]) {
    const contractRepo = { find: jest.fn().mockResolvedValue(contracts) };
    const emptyRepo = { find: jest.fn().mockResolvedValue([]) };
    return new BalanceInputLoaderService(
      contractRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
    );
  }

  it('keeps contracts as-is without overrides', async () => {
    const service = makeService([baseContract]);
    const input = await service.loadCalcInput(
      orgId,
      employeeId,
      '2026-01-01',
      '2026-12-31',
    );
    expect(input.contracts).toHaveLength(1);
    expect(input.contracts[0].endDate).toBeNull();
  });

  it('clamps an open-ended contract to contractEndDateOverride (simulated early exit)', async () => {
    const service = makeService([baseContract]);
    const input = await service.loadCalcInput(
      orgId,
      employeeId,
      '2026-01-01',
      '2026-12-31',
      { contractEndDateOverride: '2026-06-30' },
    );
    expect(input.contracts).toHaveLength(1);
    expect(input.contracts[0].endDate).toBe('2026-06-30');
  });

  it('keeps the earlier real endDate when it is before the override', async () => {
    const service = makeService([{ ...baseContract, endDate: '2026-03-31' }]);
    const input = await service.loadCalcInput(
      orgId,
      employeeId,
      '2026-01-01',
      '2026-12-31',
      { contractEndDateOverride: '2026-06-30' },
    );
    expect(input.contracts[0].endDate).toBe('2026-03-31');
  });

  it('drops contracts that only start after the override date', async () => {
    const service = makeService([
      { ...baseContract, id: 'c2', startDate: '2026-08-01' },
    ]);
    const input = await service.loadCalcInput(
      orgId,
      employeeId,
      '2026-01-01',
      '2026-12-31',
      { contractEndDateOverride: '2026-06-30' },
    );
    expect(input.contracts).toHaveLength(0);
  });
});
