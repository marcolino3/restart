import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { PasswordService } from '@/users/password.service';
import { EmployeeAuditLogService } from '../employee-audit-log/employee-audit-log.service';
import {
  TEST_ORG_ID,
  TEST_OTHER_ORG_ID,
  expectCrossOrgNotFound,
} from '@/common/testing/auth-test.util';

// ── mock factories ─────────────────────────────────────────────────
const createMockEmployeeRepo = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
});

/**
 * EntityManager whose `transaction(cb)` runs the callback with a supplied
 * transaction-scoped manager mock, so the service's transactional methods can
 * be exercised without a real database.
 */
const createMockEntityManager = (txManager: unknown) => ({
  transaction: jest.fn((cb: (m: unknown) => unknown) => cb(txManager)),
});

/** Typed read of `find({ where: { membership: { organizationId } } })`. */
const whereMembershipOrgIdOf = (find: jest.Mock): unknown => {
  const args = find.mock.calls[0] as unknown[] | undefined;
  const options = args?.[0] as {
    where?: { membership?: { organizationId?: string } };
  };
  return options?.where?.membership?.organizationId;
};

describe('EmployeesService', () => {
  let service: EmployeesService;
  let employeeRepo: ReturnType<typeof createMockEmployeeRepo>;
  let txManager: {
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    findOneOrFail: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let auditLog: { logChanges: jest.Mock };

  beforeEach(async () => {
    employeeRepo = createMockEmployeeRepo();
    txManager = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn((_entity, data: unknown) => data),
      save: jest.fn((_entity, data: unknown) => Promise.resolve(data)),
    };
    auditLog = { logChanges: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: EntityManager,
          useValue: createMockEntityManager(txManager),
        },
        { provide: PasswordService, useValue: {} },
        { provide: EmployeeAuditLogService, useValue: auditLog },
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findEmployeeById ─────────────────────────────────────────────
  describe('findEmployeeById', () => {
    it('returns the employee when it belongs to the active org', async () => {
      const employee = {
        id: 'emp-1',
        membership: { organizationId: TEST_ORG_ID },
      };
      employeeRepo.findOne.mockResolvedValue(employee);

      await expect(
        service.findEmployeeById('emp-1', TEST_ORG_ID),
      ).resolves.toBe(employee);
    });

    it('throws NotFound when the employee does not exist', async () => {
      employeeRepo.findOne.mockResolvedValue(null);
      await expectCrossOrgNotFound(() =>
        service.findEmployeeById('emp-1', TEST_ORG_ID),
      );
    });

    it('masks cross-org access as NotFound', async () => {
      // Employee belongs to another org — must not leak to the active org.
      employeeRepo.findOne.mockResolvedValue({
        id: 'emp-1',
        membership: { organizationId: TEST_OTHER_ORG_ID },
      });
      await expectCrossOrgNotFound(() =>
        service.findEmployeeById('emp-1', TEST_ORG_ID),
      );
    });
  });

  // ── updateEmployeeMinimal ────────────────────────────────────────
  describe('updateEmployeeMinimal', () => {
    it('masks cross-org update as NotFound', async () => {
      txManager.findOne.mockResolvedValue({
        id: 'emp-1',
        membership: { organizationId: TEST_OTHER_ORG_ID, user: {} },
      });

      await expectCrossOrgNotFound(() =>
        service.updateEmployeeMinimal(
          { id: 'emp-1', firstName: 'New' },
          TEST_ORG_ID,
        ),
      );
      // No audit entry may be written for a rejected cross-org update.
      expect(auditLog.logChanges).not.toHaveBeenCalled();
    });

    it('throws NotFound when the employee does not exist', async () => {
      txManager.findOne.mockResolvedValue(null);
      await expectCrossOrgNotFound(() =>
        service.updateEmployeeMinimal(
          { id: 'emp-1', firstName: 'New' },
          TEST_ORG_ID,
        ),
      );
    });
  });

  // ── findEmployeesByOrgId ─────────────────────────────────────────
  describe('findEmployeesByOrgId', () => {
    it('scopes the query to the active organization', async () => {
      const employees = [{ id: 'emp-1' }];
      employeeRepo.find.mockResolvedValue(employees);

      const result = await service.findEmployeesByOrgId(TEST_ORG_ID);

      expect(result).toBe(employees);
      expect(whereMembershipOrgIdOf(employeeRepo.find)).toBe(TEST_ORG_ID);
    });
  });

  // ── findTeachersByOrgId ──────────────────────────────────────────
  describe('findTeachersByOrgId', () => {
    it('scopes the query to the active organization', async () => {
      const teachers = [{ id: 'emp-2' }];
      employeeRepo.find.mockResolvedValue(teachers);

      const result = await service.findTeachersByOrgId(TEST_ORG_ID);

      expect(result).toBe(teachers);
      expect(whereMembershipOrgIdOf(employeeRepo.find)).toBe(TEST_ORG_ID);
    });
  });
});
