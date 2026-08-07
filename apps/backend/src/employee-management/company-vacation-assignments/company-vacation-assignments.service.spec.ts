import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CompanyVacationAssignmentsService } from './company-vacation-assignments.service';
import { CompanyVacationAssignment } from './entities/company-vacation-assignment.entity';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';
import { BalanceRecomputeService } from '@/employee-management/work-time-calculation/balance-recompute.service';

describe('CompanyVacationAssignmentsService', () => {
  let service: CompanyVacationAssignmentsService;
  let assignmentRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let companyVacationRepo: { findOne: jest.Mock };
  let recompute: { recomputeRange: jest.Mock };

  const vacation = {
    id: 'cv-1',
    organizationId: 'org-a',
    name: 'Sommerferien',
    startDate: '2026-07-01',
    endDate: '2026-08-15',
  };

  beforeEach(async () => {
    assignmentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((e) => e),
      save: jest
        .fn()
        .mockImplementation((e) => Promise.resolve({ id: 'assign-1', ...e })),
      delete: jest.fn(),
    };
    companyVacationRepo = { findOne: jest.fn() };
    recompute = { recomputeRange: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyVacationAssignmentsService,
        {
          provide: getRepositoryToken(CompanyVacationAssignment),
          useValue: assignmentRepo,
        },
        {
          provide: getRepositoryToken(CompanyVacation),
          useValue: companyVacationRepo,
        },
        { provide: BalanceRecomputeService, useValue: recompute },
      ],
    }).compile();

    service = module.get(CompanyVacationAssignmentsService);
  });

  describe('assign', () => {
    it('throws NotFoundException for a foreign-org vacation', async () => {
      companyVacationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assign('cv-foreign', 'emp-1', 'org-a'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(companyVacationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'cv-foreign', organizationId: 'org-a' },
      });
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
    });

    it('creates the assignment and recomputes the employee range', async () => {
      companyVacationRepo.findOne.mockResolvedValue(vacation);
      assignmentRepo.findOne.mockResolvedValue(null);

      await service.assign('cv-1', 'emp-1', 'org-a');

      expect(assignmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-a',
          companyVacationId: 'cv-1',
          employeeId: 'emp-1',
        }),
      );
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-a',
        'emp-1',
        '2026-07-01',
        '2026-08-15',
      );
    });

    it('is idempotent when already assigned', async () => {
      companyVacationRepo.findOne.mockResolvedValue(vacation);
      assignmentRepo.findOne.mockResolvedValue({ id: 'assign-existing' });

      const result = await service.assign('cv-1', 'emp-1', 'org-a');

      expect(result).toEqual({ id: 'assign-existing' });
      expect(assignmentRepo.save).not.toHaveBeenCalled();
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
    });
  });

  describe('unassign', () => {
    it('deletes the assignment and recomputes the employee range', async () => {
      companyVacationRepo.findOne.mockResolvedValue(vacation);
      assignmentRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.unassign('cv-1', 'emp-1', 'org-a');

      expect(result).toBe(true);
      expect(assignmentRepo.delete).toHaveBeenCalledWith({
        organizationId: 'org-a',
        companyVacationId: 'cv-1',
        employeeId: 'emp-1',
      });
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-a',
        'emp-1',
        '2026-07-01',
        '2026-08-15',
      );
    });

    it('does not recompute when nothing was assigned', async () => {
      companyVacationRepo.findOne.mockResolvedValue(vacation);
      assignmentRepo.delete.mockResolvedValue({ affected: 0 });

      const result = await service.unassign('cv-1', 'emp-1', 'org-a');

      expect(result).toBe(false);
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
    });
  });

  describe('findForEmployee', () => {
    it('returns only vacations explicitly assigned to the employee', async () => {
      assignmentRepo.find.mockResolvedValue([
        { companyVacationId: 'cv-1', companyVacation: vacation },
      ]);

      const result = await service.findForEmployee('emp-1', 'org-a');

      expect(assignmentRepo.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-a', employeeId: 'emp-1' },
        relations: { companyVacation: true },
      });
      expect(result).toEqual([vacation]);
    });

    it('scopes to the active org id (multi-tenant isolation)', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      await service.findForEmployee('emp-1', 'org-b');
      expect(assignmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-b', employeeId: 'emp-1' },
        }),
      );
    });
  });
});
