import { ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WorkTimeBalanceService } from './work-time-balance.service';
import { TimeTrackingAccessService } from './time-tracking-access.service';
import { DailyTimeTrackingKind } from './dto/work-time-balance.output';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { EmployeePeriodOpeningBalance } from '@/employee-management/time-tracking-periods/entities/employee-period-opening-balance.entity';
import { Membership } from '@/memberships/entities/membership.entity';

/**
 * Fokus-Test für getMonthlyTimeTracking: Zugriffsprüfung (Fremd-Org/-Mitarbeiter
 * muss fehlschlagen) und die Klassifikation/Gruppierung der Tage. Die
 * einzelnen SUM/JOIN-Queries werden gemockt — hier geht es um Access-Scoping
 * und die Zusammenführung der Query-Ergebnisse, nicht um SQL.
 */
describe('WorkTimeBalanceService.getMonthlyTimeTracking', () => {
  let service: WorkTimeBalanceService;
  let query: jest.Mock;
  let assertCanViewEmployee: jest.Mock;
  let resolveCallerEmployeeId: jest.Mock;

  const user: TokenPayload = { sub: 'u1', orgId: 'org-1' };

  beforeEach(() => {
    query = jest.fn();
    assertCanViewEmployee = jest.fn().mockResolvedValue(undefined);
    resolveCallerEmployeeId = jest.fn().mockResolvedValue('emp-1');
    const dataSource = { query } as unknown as DataSource;
    const access = {
      assertCanViewEmployee,
      resolveCallerEmployeeId,
    } as unknown as TimeTrackingAccessService;
    service = new WorkTimeBalanceService(
      dataSource,
      {} as Repository<EmployeeContract>,
      {} as Repository<EmployeePeriodOpeningBalance>,
      {} as Repository<Membership>,
      access,
    );
  });

  it('rejects viewing an employee outside the caller scope (multi-tenant/isolation)', async () => {
    assertCanViewEmployee.mockRejectedValue(new ForbiddenException());

    await expect(
      service.getMonthlyTimeTracking(
        user,
        'other-org-employee',
        '2026-01-01',
        '2026-01-31',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(query).not.toHaveBeenCalled();
  });

  it('classifies days by ledger flags and groups them by month', async () => {
    query
      .mockResolvedValueOnce([
        {
          date: '2026-01-15',
          is_holiday: false,
          is_vacation: false,
          is_absence: false,
          worked_minutes: 480,
          planned_minutes: 480,
        },
        {
          date: '2026-01-16',
          is_holiday: false,
          is_vacation: false,
          is_absence: true,
          worked_minutes: 0,
          planned_minutes: 420,
        },
        {
          date: '2026-02-01',
          is_holiday: true,
          is_vacation: false,
          is_absence: false,
          worked_minutes: 0,
          planned_minutes: 0,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'entry-1',
          entry_date: '2026-01-15',
          started_at: new Date('2026-01-15T08:00:00Z'),
          ended_at: new Date('2026-01-15T16:00:00Z'),
          break_minutes: 30,
          work_minutes: 480,
          notes: null,
        },
      ])
      .mockResolvedValueOnce([
        { date: '2026-01-16', name: 'Ferien', color: '#ff0000' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ date: '2026-02-01', name: 'Neujahr' }]);

    const result = await service.getMonthlyTimeTracking(
      user,
      'emp-1',
      '2026-01-01',
      '2026-02-28',
    );

    expect(result).toHaveLength(2);
    // Most recent month first.
    expect(result[0].year).toBe(2026);
    expect(result[0].month).toBe(2);
    expect(result[0].days[0].kind).toBe(DailyTimeTrackingKind.HOLIDAY);
    expect(result[0].days[0].label).toBe('Neujahr');

    const january = result[1];
    expect(january.month).toBe(1);
    expect(january.workedMinutes).toBe(480);
    expect(january.plannedMinutes).toBe(900);
    const entryDay = january.days.find((d) => d.date === '2026-01-15');
    expect(entryDay?.kind).toBe(DailyTimeTrackingKind.ENTRY);
    expect(entryDay?.entries?.[0].id).toBe('entry-1');
    expect(entryDay?.plannedMinutes).toBe(480);
    const absenceDay = january.days.find((d) => d.date === '2026-01-16');
    expect(absenceDay?.kind).toBe(DailyTimeTrackingKind.ABSENCE);
    expect(absenceDay?.label).toBe('Ferien');
    expect(absenceDay?.color).toBe('#ff0000');
    expect(absenceDay?.plannedMinutes).toBe(420);
  });

  it('excludes soft-deleted entries from the entries query (regression: deleted entries stayed visible and triggered "TimeTracking entry not found" on delete)', async () => {
    query.mockResolvedValue([]);

    await service.getMonthlyTimeTracking(
      user,
      'emp-1',
      '2026-01-01',
      '2026-01-31',
    );

    const entriesQueryCall = query.mock.calls.find(([sql]) =>
      sql.includes('FROM time_tracking_entries'),
    );
    expect(entriesQueryCall?.[0]).toMatch(/"isActive"\s*=\s*true/);
  });

  it('getMyMonthlyTimeTracking rejects when the caller has no employee profile', async () => {
    resolveCallerEmployeeId.mockResolvedValue(null);

    await expect(
      service.getMyMonthlyTimeTracking(user, '2026-01-01', '2026-01-31'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(assertCanViewEmployee).not.toHaveBeenCalled();
  });
});
