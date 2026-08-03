import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { EmployeeContractsService } from './employee-contracts.service';
import {
  EmployeeContract,
  EmployeeContractType,
} from './entities/employee-contract.entity';

const ORG_ID = 'org-1';
const EMPLOYEE_ID = 'emp-1';

describe('EmployeeContractsService', () => {
  let service: EmployeeContractsService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((v) => v),
      save: jest.fn((v) => Promise.resolve({ id: 'c-new', ...v })),
    };
    dataSource = {
      transaction: jest.fn((cb) => cb({ getRepository: () => repo })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeContractsService,
        {
          provide: getRepositoryToken(EmployeeContract),
          useValue: repo,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(EmployeeContractsService);
  });

  describe('create', () => {
    const baseInput = {
      employeeId: EMPLOYEE_ID,
      startDate: '2026-08-01',
      contractType: EmployeeContractType.PERMANENT,
      grossSalary: 8000,
    };

    it('creates the first contract without a predecessor', async () => {
      repo.findOne.mockResolvedValue(null);

      const created = await service.create(baseInput, ORG_ID);

      expect(created).toEqual(
        expect.objectContaining({
          employeeId: EMPLOYEE_ID,
          startDate: '2026-08-01',
          organizationId: ORG_ID,
          previousContractId: null,
        }),
      );
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('ends the previous open contract the day before the new start', async () => {
      const previous = {
        id: 'c-old',
        employeeId: EMPLOYEE_ID,
        organizationId: ORG_ID,
        startDate: '2025-01-01',
        endDate: null as string | null,
        isActive: true,
      };
      repo.findOne.mockResolvedValue(previous);

      await service.create(baseInput, ORG_ID);

      expect(previous.endDate).toBe('2026-07-31');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'c-old', endDate: '2026-07-31' }),
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2026-08-01',
          previousContractId: 'c-old',
        }),
      );
    });

    it('shortens a previous contract that would overlap the new start', async () => {
      const previous = {
        id: 'c-old',
        employeeId: EMPLOYEE_ID,
        organizationId: ORG_ID,
        startDate: '2025-01-01',
        endDate: '2026-12-31',
        isActive: true,
      };
      repo.findOne.mockResolvedValue(previous);

      await service.create(baseInput, ORG_ID);

      expect(previous.endDate).toBe('2026-07-31');
    });

    it('leaves a non-overlapping predecessor endDate unchanged', async () => {
      const previous = {
        id: 'c-old',
        employeeId: EMPLOYEE_ID,
        organizationId: ORG_ID,
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        isActive: true,
      };
      repo.findOne.mockResolvedValue(previous);

      await service.create(baseInput, ORG_ID);

      expect(previous.endDate).toBe('2025-12-31');
      // Only the new contract is saved (predecessor already closed).
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ previousContractId: 'c-old' }),
      );
    });

    it('rejects a new startDate on or before the previous startDate', async () => {
      repo.findOne.mockResolvedValue({
        id: 'c-old',
        startDate: '2026-08-01',
        endDate: null,
        isActive: true,
      });

      await expect(service.create(baseInput, ORG_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('clears day shares when exact times are provided on create', async () => {
      repo.findOne.mockResolvedValue(null);

      await service.create(
        {
          ...baseInput,
          weekdayTimeWindows: {
            mon: [{ start: '08:00', end: '12:00' }],
          },
          weekdayWorkloads: { mon: 20, tue: 20 },
        },
        ORG_ID,
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          weekdayTimeWindows: {
            mon: [{ start: '08:00', end: '12:00' }],
          },
          weekdayWorkloads: null,
        }),
      );
    });
  });

  describe('update', () => {
    it('versions with previous.endDate = day before new start', async () => {
      const previous = {
        id: 'c-old',
        employeeId: EMPLOYEE_ID,
        organizationId: ORG_ID,
        startDate: '2025-01-01',
        endDate: null as string | null,
        contractType: EmployeeContractType.PERMANENT,
        grossSalary: 8000,
        isActive: true,
      };
      repo.findOne.mockResolvedValue(previous);

      await service.update(
        {
          id: 'c-old',
          startDate: '2026-08-01',
          contractType: EmployeeContractType.PERMANENT,
          grossSalary: 8500,
        },
        ORG_ID,
      );

      expect(previous.endDate).toBe('2026-07-31');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2026-08-01',
          previousContractId: 'c-old',
          grossSalary: 8500,
        }),
      );
    });

    it('updates in place when the startDate stays the same', async () => {
      const previous = {
        id: 'c-old',
        employeeId: EMPLOYEE_ID,
        organizationId: ORG_ID,
        startDate: '2025-01-01',
        endDate: null as string | null,
        contractType: EmployeeContractType.PERMANENT,
        grossSalary: 8000,
        workloadPercent: 80,
        isActive: true,
      };
      repo.findOne.mockResolvedValue(previous);
      dataSource.transaction.mockClear();

      await service.update(
        {
          id: 'c-old',
          startDate: '2025-01-01',
          contractType: EmployeeContractType.PERMANENT,
          grossSalary: 8500,
          workloadPercent: 60,
        },
        ORG_ID,
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'c-old',
          startDate: '2025-01-01',
          grossSalary: 8500,
          workloadPercent: 60,
        }),
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects a startDate before the previous contract start', async () => {
      repo.findOne.mockResolvedValue({
        id: 'c-old',
        employeeId: EMPLOYEE_ID,
        organizationId: ORG_ID,
        startDate: '2026-08-01',
        contractType: EmployeeContractType.PERMANENT,
        grossSalary: 8000,
        isActive: true,
      });

      await expect(
        service.update(
          {
            id: 'c-old',
            startDate: '2026-07-01',
            contractType: EmployeeContractType.PERMANENT,
            grossSalary: 8500,
          },
          ORG_ID,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('clears day shares when exact times are provided', async () => {
      const previous = {
        id: 'c-old',
        employeeId: EMPLOYEE_ID,
        organizationId: ORG_ID,
        startDate: '2025-01-01',
        endDate: null as string | null,
        contractType: EmployeeContractType.PERMANENT,
        grossSalary: 8000,
        weekdayWorkloads: { mon: 20, tue: 20 },
        weekdayTimeWindows: null,
        isActive: true,
      };
      repo.findOne.mockResolvedValue(previous);

      await service.update(
        {
          id: 'c-old',
          startDate: '2025-01-01',
          contractType: EmployeeContractType.PERMANENT,
          grossSalary: 8000,
          weekdayTimeWindows: {
            mon: [{ start: '08:00', end: '12:00' }],
          },
        },
        ORG_ID,
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          weekdayTimeWindows: {
            mon: [{ start: '08:00', end: '12:00' }],
          },
          weekdayWorkloads: null,
        }),
      );
    });

    it('does not clear workloads when windows are an empty object', async () => {
      const previous = {
        id: 'c-old',
        employeeId: EMPLOYEE_ID,
        organizationId: ORG_ID,
        startDate: '2025-01-01',
        endDate: null as string | null,
        contractType: EmployeeContractType.PERMANENT,
        grossSalary: 8000,
        weekdayWorkloads: { mon: 20, tue: 20 },
        weekdayTimeWindows: null,
        isActive: true,
      };
      repo.findOne.mockResolvedValue(previous);

      await service.update(
        {
          id: 'c-old',
          startDate: '2025-01-01',
          contractType: EmployeeContractType.PERMANENT,
          grossSalary: 8000,
          weekdayTimeWindows: {},
          weekdayWorkloads: { mon: 20, tue: 20 },
        },
        ORG_ID,
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          weekdayTimeWindows: null,
          weekdayWorkloads: { mon: 20, tue: 20 },
        }),
      );
    });
  });
});
