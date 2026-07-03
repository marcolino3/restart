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
      findOne: jest.fn((entity: { name: string }) =>
        Promise.resolve((rows as Record<string, unknown>)[entity.name] ?? null),
      ),
      find: jest.fn((entity: { name: string }) =>
        Promise.resolve(entity.name === 'Role' ? (rows.Role ?? []) : []),
      ),
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
