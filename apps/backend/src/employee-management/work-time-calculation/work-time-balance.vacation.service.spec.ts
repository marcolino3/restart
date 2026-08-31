import { DataSource, Repository } from 'typeorm';
import { WorkTimeBalanceService } from './work-time-balance.service';
import { TimeTrackingAccessService } from './time-tracking-access.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { EmployeePeriodOpeningBalance } from '@/employee-management/time-tracking-periods/entities/employee-period-opening-balance.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { EmployeeAbsence } from '@/employee-management/employee-absences/entities/employee-absence.entity';
import { Organization } from '@/organizations/entities/organization.entity';

/**
 * Ferien-Saldo inkl. Kürzung nach OR Art. 329b: nur CH-Organisationen kürzen,
 * genehmigte Absenzen mit Schonfrist werden über den Bereich kumuliert.
 */
describe('WorkTimeBalanceService.getVacationBalance', () => {
  const user: TokenPayload = { sub: 'u1', orgId: 'org-1' };
  let orgFindOne: jest.Mock;
  let absenceGetMany: jest.Mock;
  let service: WorkTimeBalanceService;

  const qb = (getMany: jest.Mock) => {
    const builder: Record<string, unknown> = {};
    for (const m of [
      'where',
      'andWhere',
      'innerJoinAndSelect',
      'innerJoin',
      'select',
    ]) {
      builder[m] = jest.fn().mockReturnValue(builder);
    }
    builder.getMany = getMany;
    builder.getRawOne = jest.fn().mockResolvedValue(undefined);
    return builder;
  };

  beforeEach(() => {
    orgFindOne = jest.fn().mockResolvedValue({ id: 'org-1', country: 'CH' });
    absenceGetMany = jest.fn().mockResolvedValue([]);
    const query = jest.fn().mockResolvedValue([
      {
        planned_minutes: 0,
        worked_minutes: 0,
        vacation_minutes: 0,
        absence_minutes: 0,
        actual_minutes: 0,
        difference_minutes: 0,
        vacation_days_used: 3,
        absence_days_count: 0,
      },
    ]);
    const contractGetMany = jest
      .fn()
      .mockResolvedValue([
        { startDate: '2026-01-01', endDate: null, annualVacationDays: 25 },
      ]);
    const access = {
      assertCanViewEmployee: jest.fn().mockResolvedValue(undefined),
    } as unknown as TimeTrackingAccessService;
    service = new WorkTimeBalanceService(
      { query } as unknown as DataSource,
      {
        createQueryBuilder: () => qb(contractGetMany),
      } as unknown as Repository<EmployeeContract>,
      {
        createQueryBuilder: () => qb(jest.fn()),
      } as unknown as Repository<EmployeePeriodOpeningBalance>,
      {} as Repository<Membership>,
      {
        createQueryBuilder: () => qb(absenceGetMany),
      } as unknown as Repository<EmployeeAbsence>,
      { findOne: orgFindOne } as unknown as Repository<Organization>,
      access,
    );
  });

  const sickness = (start: string, end: string, percentage = 100) => ({
    startDate: new Date(`${start}T00:00:00Z`),
    endDate: new Date(`${end}T00:00:00Z`),
    percentage,
    absenceCategory: { reducesVacationEntitlementAfterDays: 30 },
  });

  it('reduces the entitlement for a Swiss organization', async () => {
    absenceGetMany.mockResolvedValue([sickness('2026-02-01', '2026-04-16')]); // 75 days
    const res = await service.getVacationBalance(
      user,
      'emp-1',
      '2026-01-01',
      '2026-12-31',
    );
    expect(res.reductionDays).toBe(2);
    expect(res.remainingDays).toBe(25 + 0 - 3 - 2);
  });

  it('only counts the overlap with the requested range', async () => {
    absenceGetMany.mockResolvedValue([sickness('2025-12-01', '2026-02-14')]); // 45 in range
    const res = await service.getVacationBalance(
      user,
      'emp-1',
      '2026-01-01',
      '2026-12-31',
    );
    expect(res.reductionDays).toBe(0);
  });

  it('never reduces for organizations outside Switzerland', async () => {
    orgFindOne.mockResolvedValue({ id: 'org-1', country: 'DE' });
    const res = await service.getVacationBalance(
      user,
      'emp-1',
      '2026-01-01',
      '2026-12-31',
    );
    expect(absenceGetMany).not.toHaveBeenCalled();
    expect(res.reductionDays).toBe(0);
    expect(res.remainingDays).toBe(22);
  });
});
