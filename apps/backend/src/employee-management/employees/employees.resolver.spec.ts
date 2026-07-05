import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeesResolver } from './employees.resolver';
import { EmployeesService } from './employees.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { UpdateEmployeeInput } from './dto/update-employee.input';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { WorkTimeBalanceService } from '@/employee-management/work-time-calculation/work-time-balance.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Employee } from './entities/employee.entity';

describe('EmployeesResolver', () => {
  let resolver: EmployeesResolver;
  let employeesService: {
    createEmployeeMinimal: jest.Mock;
    updateEmployeeMinimal: jest.Mock;
    upsertEmployeeOnboardingDraft: jest.Mock;
    finalizeEmployeeOnboarding: jest.Mock;
    sendEmployeeInvitation: jest.Mock;
    findEmployeesByOrgId: jest.Mock;
    findTeachersByOrgId: jest.Mock;
    findEmployeeById: jest.Mock;
  };
  let contractRepo: { find: jest.Mock };
  let balanceService: { getListNetBalanceMinutes: jest.Mock };

  const user: TokenPayload = { sub: 'user-1', orgId: 'org-1' };

  beforeEach(async () => {
    employeesService = {
      createEmployeeMinimal: jest.fn(),
      updateEmployeeMinimal: jest.fn(),
      upsertEmployeeOnboardingDraft: jest.fn(),
      finalizeEmployeeOnboarding: jest.fn(),
      sendEmployeeInvitation: jest.fn(),
      findEmployeesByOrgId: jest.fn(),
      findTeachersByOrgId: jest.fn(),
      findEmployeeById: jest.fn(),
    };
    contractRepo = { find: jest.fn().mockResolvedValue([]) };
    balanceService = { getListNetBalanceMinutes: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesResolver,
        { provide: EmployeesService, useValue: employeesService },
        {
          provide: getRepositoryToken(EmployeeContract),
          useValue: contractRepo,
        },
        { provide: WorkTimeBalanceService, useValue: balanceService },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<EmployeesResolver>(EmployeesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createEmployee', () => {
    it('delegates to the service with the current org id from the session', async () => {
      const input = {
        email: 'jane.doe@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      } as CreateEmployeeInput;
      const created = { id: 'emp-1' };
      employeesService.createEmployeeMinimal.mockResolvedValue(created);

      await expect(resolver.createEmployee(input, 'org-1')).resolves.toBe(
        created,
      );
      expect(employeesService.createEmployeeMinimal).toHaveBeenCalledWith(
        input,
        'org-1',
      );
    });
  });

  describe('updateEmployee', () => {
    const input = { id: 'emp-1', firstName: 'New' } as UpdateEmployeeInput;

    it('delegates with org id and the actor membership id', async () => {
      const updated = { id: 'emp-1' };
      employeesService.updateEmployeeMinimal.mockResolvedValue(updated);

      await expect(
        resolver.updateEmployee(input, 'org-1', {
          sub: 'user-1',
          membershipId: 'mem-1',
        }),
      ).resolves.toBe(updated);
      expect(employeesService.updateEmployeeMinimal).toHaveBeenCalledWith(
        input,
        'org-1',
        'mem-1',
      );
    });

    it('passes null as actor when no membership id is present', async () => {
      employeesService.updateEmployeeMinimal.mockResolvedValue({ id: 'emp-1' });

      await resolver.updateEmployee(input, 'org-1', undefined);

      expect(employeesService.updateEmployeeMinimal).toHaveBeenCalledWith(
        input,
        'org-1',
        null,
      );
    });
  });

  describe('upsertEmployeeOnboardingDraft', () => {
    it('delegates with the current org id from the session (multi-tenant)', async () => {
      const input = { firstName: 'Jane', lastName: 'Doe' } as never;
      const draft = { id: 'emp-1', status: 'DRAFT' };
      employeesService.upsertEmployeeOnboardingDraft.mockResolvedValue(draft);

      await expect(
        resolver.upsertEmployeeOnboardingDraft(input, 'org-1'),
      ).resolves.toBe(draft);
      expect(
        employeesService.upsertEmployeeOnboardingDraft,
      ).toHaveBeenCalledWith(input, 'org-1');
    });
  });

  describe('finalizeEmployeeOnboarding', () => {
    it('delegates with the current org id from the session (multi-tenant)', async () => {
      const input = { id: 'emp-1', invitationTiming: 'IMMEDIATE' } as never;
      const finalized = { id: 'emp-1', status: 'ACTIVE' };
      employeesService.finalizeEmployeeOnboarding.mockResolvedValue(finalized);

      await expect(
        resolver.finalizeEmployeeOnboarding(input, 'org-1'),
      ).resolves.toBe(finalized);
      expect(employeesService.finalizeEmployeeOnboarding).toHaveBeenCalledWith(
        input,
        'org-1',
      );
    });
  });

  describe('sendEmployeeInvitation', () => {
    it('delegates with employee id and the current org id (multi-tenant)', async () => {
      const employee = { id: 'emp-1', invitationStatus: 'SENT' };
      employeesService.sendEmployeeInvitation.mockResolvedValue(employee);

      await expect(
        resolver.sendEmployeeInvitation('emp-1', 'org-1'),
      ).resolves.toBe(employee);
      expect(employeesService.sendEmployeeInvitation).toHaveBeenCalledWith(
        'emp-1',
        'org-1',
      );
    });
  });

  describe('findEmployeesByOrgId', () => {
    it('scopes the query to the current org id (multi-tenant isolation)', async () => {
      const employees = [{ id: 'emp-1' }];
      employeesService.findEmployeesByOrgId.mockResolvedValue(employees);

      await expect(resolver.findEmployeesByOrgId('org-1')).resolves.toBe(
        employees,
      );
      expect(employeesService.findEmployeesByOrgId).toHaveBeenCalledWith(
        'org-1',
      );
    });
  });

  describe('findTeachersByOrgId', () => {
    it('scopes the query to the current org id', async () => {
      employeesService.findTeachersByOrgId.mockResolvedValue([]);

      await resolver.findTeachersByOrgId('org-1');

      expect(employeesService.findTeachersByOrgId).toHaveBeenCalledWith(
        'org-1',
      );
    });
  });

  describe('findEmployeeById', () => {
    it('delegates with employee id and the current org id', async () => {
      const employee = { id: 'emp-1' };
      employeesService.findEmployeeById.mockResolvedValue(employee);

      await expect(resolver.findEmployeeById('emp-1', 'org-1')).resolves.toBe(
        employee,
      );
      expect(employeesService.findEmployeeById).toHaveBeenCalledWith(
        'emp-1',
        'org-1',
      );
    });

    it('propagates NotFoundException for employees of a foreign org (multi-tenant isolation)', async () => {
      employeesService.findEmployeeById.mockRejectedValue(
        new NotFoundException('Employee not found'),
      );

      await expect(
        resolver.findEmployeeById('emp-of-other-org', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('workloadPercent (resolve field)', () => {
    it('returns the current contract workload, org-scoped (multi-tenant)', async () => {
      contractRepo.find.mockResolvedValue([
        { employeeId: 'emp-1', startDate: '2024-01-01', workloadPercent: 80 },
        { employeeId: 'emp-1', startDate: '2023-01-01', workloadPercent: 50 },
      ]);

      const result = await resolver.workloadPercent(
        { id: 'emp-1' } as Employee,
        'org-1',
        user,
        {},
      );

      expect(result).toBe(80);
      expect(contractRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-1' }),
        }),
      );
    });

    it('returns null when the employee has no active contract', async () => {
      contractRepo.find.mockResolvedValue([]);

      await expect(
        resolver.workloadPercent(
          { id: 'emp-2' } as Employee,
          'org-1',
          user,
          {},
        ),
      ).resolves.toBeNull();
    });
  });

  describe('timeBalanceMinutes (resolve field)', () => {
    it('returns null without querying when time tracking is disabled', async () => {
      const result = await resolver.timeBalanceMinutes(
        { id: 'emp-1', timeTrackingEnabled: false } as Employee,
        'org-1',
        user,
        {},
      );

      expect(result).toBeNull();
      expect(balanceService.getListNetBalanceMinutes).not.toHaveBeenCalled();
    });

    it('returns the net balance for time-tracked employees', async () => {
      balanceService.getListNetBalanceMinutes.mockResolvedValue(
        new Map([['emp-1', 750]]),
      );

      const result = await resolver.timeBalanceMinutes(
        { id: 'emp-1', timeTrackingEnabled: true } as Employee,
        'org-1',
        user,
        {},
      );

      expect(result).toBe(750);
      expect(balanceService.getListNetBalanceMinutes).toHaveBeenCalledWith(
        user,
        ['emp-1'],
      );
    });
  });
});
