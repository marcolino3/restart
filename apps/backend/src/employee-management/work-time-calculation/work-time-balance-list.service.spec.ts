import { DataSource, Repository } from 'typeorm';
import { WorkTimeBalanceService } from './work-time-balance.service';
import { TimeTrackingAccessService } from './time-tracking-access.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { EmployeePeriodOpeningBalance } from '@/employee-management/time-tracking-periods/entities/employee-period-opening-balance.entity';
import { Membership } from '@/memberships/entities/membership.entity';

/**
 * Fokus-Test für getListNetBalanceMinutes: Access-Scoping (Admin/Lead/keiner)
 * und die Beschränkung auf die angefragten IDs. Die eigentliche SUM-Query wird
 * gemockt — hier geht es um die Zugriffs-/Scope-Logik, nicht um SQL.
 */
describe('WorkTimeBalanceService.getListNetBalanceMinutes', () => {
  let service: WorkTimeBalanceService;
  let query: jest.Mock;
  let resolveOverviewScope: jest.Mock;

  const user: TokenPayload = { sub: 'u1', orgId: 'org-1' } as TokenPayload;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([]);
    resolveOverviewScope = jest.fn();
    const dataSource = { query } as unknown as DataSource;
    const access = {
      resolveOverviewScope,
    } as unknown as TimeTrackingAccessService;
    service = new WorkTimeBalanceService(
      dataSource,
      {} as Repository<EmployeeContract>,
      {} as Repository<EmployeePeriodOpeningBalance>,
      {} as Repository<Membership>,
      access,
    );
  });

  it('returns an empty map (no query) for empty input', async () => {
    const result = await service.getListNetBalanceMinutes(user, []);
    expect(result.size).toBe(0);
    expect(query).not.toHaveBeenCalled();
  });

  it('returns an empty map (no query) when the caller has no balance access', async () => {
    resolveOverviewScope.mockResolvedValue([]); // scope = [] → kein Zugriff
    const result = await service.getListNetBalanceMinutes(user, ['e1', 'e2']);
    expect(result.size).toBe(0);
    expect(query).not.toHaveBeenCalled();
  });

  it('queries all requested ids for admins (scope null)', async () => {
    resolveOverviewScope.mockResolvedValue(null);
    query.mockResolvedValue([{ employee_id: 'e1', net: 750 }]);

    const result = await service.getListNetBalanceMinutes(user, ['e1', 'e2']);

    expect(result.get('e1')).toBe(750);
    expect(result.has('e2')).toBe(false);
    const params = query.mock.calls[0][1] as unknown[];
    expect(params[0]).toBe('org-1');
    expect(params[2]).toEqual(['e1', 'e2']);
  });

  it('restricts the query to the lead-scoped intersection', async () => {
    resolveOverviewScope.mockResolvedValue(['e1']); // Lead sieht nur e1
    query.mockResolvedValue([{ employee_id: 'e1', net: -135 }]);

    const result = await service.getListNetBalanceMinutes(user, ['e1', 'e2']);

    expect(result.get('e1')).toBe(-135);
    const params = query.mock.calls[0][1] as unknown[];
    expect(params[2]).toEqual(['e1']);
  });
});
