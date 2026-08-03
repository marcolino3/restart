import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { InvitationTiming } from './dto/finalize-employee-onboarding.input';

/**
 * Focused unit tests for the onboarding orchestrator's security-critical
 * branches: multi-tenant isolation (foreign roles/teams rejected) and finalize
 * completeness. Uses a lightweight entity-aware manager mock so we can drive
 * the transaction callback without a database.
 */
describe('EmployeesService onboarding orchestrator', () => {
  let service: EmployeesService;
  let manager: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    findOneBy: jest.Mock;
    findOneOrFail: jest.Mock;
    update: jest.Mock;
  };

  // Per-test overrides for what the entity-aware manager returns.
  let rows: {
    Organization?: unknown;
    Employee?: unknown;
    EmployeeContract?: unknown;
    EmployeeFunction?: unknown;
    Team?: unknown;
    Role?: unknown[];
  };

  const invitationService = {
    sendInvite: jest.fn(),
    scheduleInvite: jest.fn(),
  };

  beforeEach(() => {
    rows = {};
    manager = {
      findOne: jest.fn(
        (
          entity: { name: string },
          opts?: { where?: Record<string, unknown> },
        ) => {
          if (entity.name === 'EmployeeFunction') {
            const raw = rows.EmployeeFunction;
            const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
            const where = opts?.where ?? {};
            const match = list.find((fn) => {
              const row = fn as Record<string, unknown>;
              if (where.id && row.id !== where.id) return false;
              if (where.name && row.name !== where.name) return false;
              if (
                where.organizationId &&
                row.organizationId !== where.organizationId
              ) {
                return false;
              }
              return true;
            });
            return Promise.resolve(match ?? null);
          }
          return Promise.resolve(
            (rows as Record<string, unknown>)[entity.name] ?? null,
          );
        },
      ),
      find: jest.fn((entity: { name: string }) => {
        if (entity.name === 'Role') {
          return Promise.resolve(rows.Role ?? []);
        }
        if (entity.name === 'EmployeeContract') {
          const row = rows.EmployeeContract;
          if (!row) return Promise.resolve([]);
          return Promise.resolve(Array.isArray(row) ? row : [row]);
        }
        return Promise.resolve([]);
      }),
      save: jest.fn((_entity: unknown, value: unknown) =>
        Promise.resolve(value),
      ),
      create: jest.fn((_entity: unknown, value: unknown) => value),
      findOneBy: jest.fn().mockResolvedValue(null),
      findOneOrFail: jest.fn(() => Promise.resolve(rows.Employee)),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const entityManager = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
    };

    service = new EmployeesService(
      entityManager as never,
      { generateRandomPasswordHash: jest.fn() },
      { logChanges: jest.fn() } as never,
      invitationService as never,
      {} as never,
    );
    jest.clearAllMocks();
  });

  describe('upsertEmployeeOnboardingDraft', () => {
    it('rejects roles that belong to a foreign organization', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      rows.Role = []; // requested role not found in org-1 → length mismatch

      await expect(
        service.upsertEmployeeOnboardingDraft(
          {
            id: 'emp-1',
            firstName: 'A',
            lastName: 'B',
            roleIds: ['role-x'],
          },
          'org-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a team that belongs to a foreign organization', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      rows.Team = null; // team not found in org-1

      await expect(
        service.upsertEmployeeOnboardingDraft(
          {
            id: 'emp-1',
            firstName: 'A',
            lastName: 'B',
            teamId: 'team-x',
          },
          'org-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects updating an employee of another organization', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        membership: { organizationId: 'other-org', user: {} },
      };

      await expect(
        service.upsertEmployeeOnboardingDraft(
          { id: 'emp-1', firstName: 'A', lastName: 'B' },
          'org-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('versions the contract when an ACTIVE employee changes terms', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        status: 'ACTIVE',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      rows.EmployeeContract = {
        id: 'c-old',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        startDate: '2025-01-01',
        endDate: null,
        contractType: 'PERMANENT',
        position: 'Teacher',
        workloadPercent: 80,
        weeklyHours: '42',
        grossSalary: 8000,
        has13thSalary: false,
        isActive: true,
      };

      await service.upsertEmployeeOnboardingDraft(
        {
          id: 'emp-1',
          firstName: 'A',
          lastName: 'B',
          contract: {
            contractType: 'PERMANENT' as never,
            startDate: '2026-08-01',
            position: 'Teacher',
            workloadPercent: 60,
            weeklyHours: '42',
            grossSalary: 8000,
            has13thSalary: false,
          },
        },
        'org-1',
      );

      // Previous row ended the day before the new start; successor created.
      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'c-old',
          endDate: '2026-07-31',
        }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          startDate: '2026-08-01',
          workloadPercent: 60,
          previousContractId: 'c-old',
        }),
      );
    });

    it('does not version when ACTIVE contract terms are unchanged', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        status: 'ACTIVE',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      const contract = {
        id: 'c-old',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        startDate: '2025-01-01',
        endDate: null,
        contractType: 'PERMANENT',
        position: 'Teacher',
        workloadPercent: 80,
        weeklyHours: '42',
        grossSalary: 8000,
        has13thSalary: false,
        isActive: true,
      };
      rows.EmployeeContract = contract;
      manager.save.mockClear();

      await service.upsertEmployeeOnboardingDraft(
        {
          id: 'emp-1',
          firstName: 'A',
          lastName: 'B',
          contract: {
            contractType: 'PERMANENT' as never,
            startDate: '2025-01-01',
            position: 'Teacher',
            workloadPercent: 80,
            weeklyHours: '42',
            grossSalary: 8000,
            has13thSalary: false,
          },
        },
        'org-1',
      );

      // Person/membership may still save; the contract row must not be rewritten.
      const contractSaves = manager.save.mock.calls.filter(
        (call) =>
          call[0]?.name === 'EmployeeContract' ||
          (call[1] &&
            typeof call[1] === 'object' &&
            'workloadPercent' in (call[1] as object) &&
            'startDate' in (call[1] as object)),
      );
      expect(contractSaves).toHaveLength(0);
    });

    it('does not version on null/false/empty-schedule noise for ACTIVE contracts', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        status: 'ACTIVE',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      rows.EmployeeContract = {
        id: 'c-old',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        startDate: '2025-01-01',
        endDate: null,
        contractType: 'PERMANENT',
        position: 'Teacher',
        workloadPercent: '80.00',
        weeklyHours: '42',
        grossSalary: '8000.00',
        has13thSalary: null,
        weekdayTimeWindows: { mon: null, tue: null },
        weekdayWorkloads: {},
        documentUrl: '',
        isActive: true,
      };
      manager.save.mockClear();
      manager.create.mockClear();

      await service.upsertEmployeeOnboardingDraft(
        {
          id: 'emp-1',
          firstName: 'Updated',
          lastName: 'Name',
          contract: {
            contractType: 'PERMANENT' as never,
            startDate: '2025-01-01',
            position: 'Teacher',
            workloadPercent: 80,
            weeklyHours: '42',
            grossSalary: 8000,
            has13thSalary: false,
            weekdayTimeWindows: null,
            weekdayWorkloads: null,
          },
        },
        'org-1',
      );

      expect(manager.create).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ previousContractId: 'c-old' }),
      );
      const contractSaves = manager.save.mock.calls.filter(
        (call) =>
          call[1] &&
          typeof call[1] === 'object' &&
          'previousContractId' in (call[1] as object),
      );
      expect(contractSaves).toHaveLength(0);
    });

    it('does not version when legacy dual schedule collapses to the active mode', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        status: 'ACTIVE',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      rows.EmployeeContract = {
        id: 'c-old',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        startDate: '2025-01-01',
        endDate: null,
        contractType: 'PERMANENT',
        position: 'Teacher',
        workloadPercent: 60,
        weeklyHours: '42',
        grossSalary: 8000,
        has13thSalary: false,
        // Legacy row still has both modes populated; exclusivity prefers windows.
        weekdayTimeWindows: {
          mon: [{ start: '08:00', end: '12:00' }],
        },
        weekdayWorkloads: { mon: 20, tue: 20, wed: 20 },
        isActive: true,
      };
      manager.save.mockClear();
      manager.create.mockClear();

      await service.upsertEmployeeOnboardingDraft(
        {
          id: 'emp-1',
          firstName: 'A',
          lastName: 'B',
          contract: {
            contractType: 'PERMANENT' as never,
            startDate: '2025-01-01',
            position: 'Teacher',
            workloadPercent: 60,
            weeklyHours: '42',
            grossSalary: 8000,
            has13thSalary: false,
            weekdayTimeWindows: {
              mon: [{ start: '08:00', end: '12:00' }],
            },
            weekdayWorkloads: null,
          },
        },
        'org-1',
      );

      expect(manager.create).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ previousContractId: 'c-old' }),
      );
    });

    it('does not version when form sends function id for a legacy position label', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        status: 'ACTIVE',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      rows.EmployeeFunction = {
        id: 'fn-teacher',
        name: 'Teacher',
        organizationId: 'org-1',
      };
      rows.EmployeeContract = {
        id: 'c-old',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        startDate: '2025-01-01',
        endDate: null,
        contractType: 'PERMANENT',
        position: 'Teacher',
        workloadPercent: 80,
        weeklyHours: '42',
        grossSalary: 8000,
        has13thSalary: false,
        isActive: true,
      };
      manager.save.mockClear();
      manager.create.mockClear();

      await service.upsertEmployeeOnboardingDraft(
        {
          id: 'emp-1',
          firstName: 'A',
          lastName: 'B',
          contract: {
            contractType: 'PERMANENT' as never,
            startDate: '2025-01-01',
            position: 'fn-teacher',
            workloadPercent: 80,
            weeklyHours: '42',
            grossSalary: 8000,
            has13thSalary: false,
          },
        },
        'org-1',
      );

      expect(manager.create).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ previousContractId: 'c-old' }),
      );
    });

    it('patches DRAFT contracts in place instead of versioning', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        status: 'DRAFT',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      rows.EmployeeContract = {
        id: 'c-draft',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        startDate: '2026-09-01',
        contractType: 'PERMANENT',
        workloadPercent: 100,
        isActive: true,
      };

      await service.upsertEmployeeOnboardingDraft(
        {
          id: 'emp-1',
          firstName: 'A',
          lastName: 'B',
          contract: {
            contractType: 'PERMANENT' as never,
            startDate: '2026-09-01',
            workloadPercent: 80,
          },
        },
        'org-1',
      );

      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'c-draft',
          workloadPercent: 80,
        }),
      );
      expect(manager.create).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ previousContractId: 'c-draft' }),
      );
    });

    it('versions against the currently valid contract when several exist', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        status: 'ACTIVE',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      // find() returns startDate DESC (same order as the service query).
      rows.EmployeeContract = [
        {
          id: 'c-future',
          employeeId: 'emp-1',
          organizationId: 'org-1',
          startDate: '2027-01-01',
          endDate: null,
          contractType: 'PERMANENT',
          position: 'Teacher',
          workloadPercent: 100,
          weeklyHours: '42',
          grossSalary: 9000,
          has13thSalary: false,
          isActive: true,
        },
        {
          id: 'c-current',
          employeeId: 'emp-1',
          organizationId: 'org-1',
          startDate: '2025-01-01',
          endDate: null,
          contractType: 'PERMANENT',
          position: 'Teacher',
          workloadPercent: 80,
          weeklyHours: '42',
          grossSalary: 8000,
          has13thSalary: false,
          isActive: true,
        },
        {
          id: 'c-expired',
          employeeId: 'emp-1',
          organizationId: 'org-1',
          startDate: '2023-01-01',
          endDate: '2024-12-31',
          contractType: 'PERMANENT',
          position: 'Teacher',
          workloadPercent: 50,
          weeklyHours: '42',
          grossSalary: 7000,
          has13thSalary: false,
          isActive: true,
        },
      ];

      await service.upsertEmployeeOnboardingDraft(
        {
          id: 'emp-1',
          firstName: 'A',
          lastName: 'B',
          contract: {
            contractType: 'PERMANENT' as never,
            startDate: '2026-09-01',
            position: 'Teacher',
            workloadPercent: 60,
            weeklyHours: '42',
            grossSalary: 8000,
            has13thSalary: false,
          },
        },
        'org-1',
      );

      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'c-current',
          endDate: '2026-08-31',
        }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          previousContractId: 'c-current',
          workloadPercent: 60,
          startDate: '2026-09-01',
        }),
      );
    });

    it('uses today as the new start when terms change but the form kept the old startDate', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-03T12:00:00.000Z'));

      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        status: 'ACTIVE',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      rows.EmployeeContract = {
        id: 'c-old',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        startDate: '2025-01-01',
        endDate: null,
        contractType: 'PERMANENT',
        position: 'Teacher',
        workloadPercent: 80,
        weeklyHours: '42',
        grossSalary: 8000,
        has13thSalary: false,
        isActive: true,
      };

      try {
        await service.upsertEmployeeOnboardingDraft(
          {
            id: 'emp-1',
            firstName: 'A',
            lastName: 'B',
            contract: {
              contractType: 'PERMANENT' as never,
              startDate: '2025-01-01',
              position: 'Teacher',
              workloadPercent: 50,
              weeklyHours: '42',
              grossSalary: 8000,
              has13thSalary: false,
            },
          },
          'org-1',
        );

        expect(manager.save).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            id: 'c-old',
            endDate: '2026-08-02',
          }),
        );
        expect(manager.create).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            previousContractId: 'c-old',
            startDate: '2026-08-03',
            workloadPercent: 50,
          }),
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('versions when only the workday schedule changes', async () => {
      rows.Organization = { id: 'org-1' };
      rows.Employee = {
        id: 'emp-1',
        status: 'ACTIVE',
        membership: { organizationId: 'org-1', user: {} },
        timeTrackingEnabled: false,
      };
      rows.EmployeeContract = {
        id: 'c-old',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        startDate: '2025-01-01',
        endDate: null,
        contractType: 'PERMANENT',
        position: 'Teacher',
        workloadPercent: 60,
        weeklyHours: '42',
        grossSalary: 8000,
        has13thSalary: false,
        weekdayWorkloads: { mon: 20, tue: 20, wed: 20 },
        weekdayTimeWindows: null,
        isActive: true,
      };

      await service.upsertEmployeeOnboardingDraft(
        {
          id: 'emp-1',
          firstName: 'A',
          lastName: 'B',
          contract: {
            contractType: 'PERMANENT' as never,
            startDate: '2026-08-01',
            position: 'Teacher',
            workloadPercent: 60,
            weeklyHours: '42',
            grossSalary: 8000,
            has13thSalary: false,
            weekdayWorkloads: { mon: 20, tue: 20, wed: 10, thu: 10 },
          },
        },
        'org-1',
      );

      expect(manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          previousContractId: 'c-old',
          weekdayWorkloads: { mon: 20, tue: 20, wed: 10, thu: 10 },
        }),
      );
    });
  });

  describe('finalizeEmployeeOnboarding', () => {
    it('rejects finalizing an employee of another organization', async () => {
      rows.Employee = { id: 'emp-1', membership: { organizationId: 'other' } };

      await expect(
        service.finalizeEmployeeOnboarding(
          { id: 'emp-1', invitationTiming: InvitationTiming.IMMEDIATE },
          'org-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('requires a contract with a start date', async () => {
      rows.Employee = {
        id: 'emp-1',
        membership: { organizationId: 'org-1', roles: [{ id: 'r1' }] },
      };
      rows.EmployeeContract = null;

      await expect(
        service.finalizeEmployeeOnboarding(
          { id: 'emp-1', invitationTiming: InvitationTiming.IMMEDIATE },
          'org-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('requires at least one role', async () => {
      rows.Employee = {
        id: 'emp-1',
        membership: { organizationId: 'org-1', roles: [] },
      };
      rows.EmployeeContract = { id: 'c1', startDate: '2026-08-01' };

      await expect(
        service.finalizeEmployeeOnboarding(
          { id: 'emp-1', invitationTiming: InvitationTiming.IMMEDIATE },
          'org-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('activates and sends the invitation immediately when complete', async () => {
      rows.Employee = {
        id: 'emp-1',
        membership: { organizationId: 'org-1', roles: [{ id: 'r1' }] },
        status: 'DRAFT',
      };
      rows.EmployeeContract = { id: 'c1', startDate: '2026-08-01' };

      await service.finalizeEmployeeOnboarding(
        { id: 'emp-1', invitationTiming: InvitationTiming.IMMEDIATE },
        'org-1',
      );

      expect(invitationService.sendInvite).toHaveBeenCalledWith(
        'emp-1',
        'org-1',
        manager,
      );
    });
  });
});
