import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeePeriodOpeningBalancesService } from './employee-period-opening-balances.service';
import { EmployeePeriodOpeningBalance } from './entities/employee-period-opening-balance.entity';
import { TimeTrackingPeriod } from './entities/time-tracking-period.entity';

describe('EmployeePeriodOpeningBalancesService', () => {
  let service: EmployeePeriodOpeningBalancesService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let periodRepo: { findOne: jest.Mock };

  const input = {
    employeeId: 'emp-1',
    periodId: 'per-1',
    openingWorkMinutes: -90,
    openingVacationDays: 2.5,
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
    };
    periodRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeePeriodOpeningBalancesService,
        {
          provide: getRepositoryToken(EmployeePeriodOpeningBalance),
          useValue: repo,
        },
        {
          provide: getRepositoryToken(TimeTrackingPeriod),
          useValue: periodRepo,
        },
      ],
    }).compile();

    service = module.get<EmployeePeriodOpeningBalancesService>(
      EmployeePeriodOpeningBalancesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmployee', () => {
    it('filtert immer nach organizationId', async () => {
      repo.find.mockResolvedValue([]);
      await service.findByEmployee('org-1', 'emp-1');
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            employeeId: 'emp-1',
            isActive: true,
          }),
        }),
      );
    });
  });

  describe('upsert', () => {
    it('wirft 404, wenn die Periode zu einer fremden Org gehört', async () => {
      periodRepo.findOne.mockResolvedValue(null);
      await expect(service.upsert(input, 'org-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(periodRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'per-1', organizationId: 'org-1', isActive: true },
      });
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('legt einen neuen Saldo an, wenn keiner existiert', async () => {
      periodRepo.findOne.mockResolvedValue({ id: 'per-1' });
      repo.findOne.mockResolvedValue(null);

      const result = await service.upsert(input, 'org-1');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          employeeId: 'emp-1',
          periodId: 'per-1',
        },
      });
      expect(repo.create).toHaveBeenCalledWith({
        ...input,
        organizationId: 'org-1',
      });
      expect(result).toEqual(
        expect.objectContaining({
          organizationId: 'org-1',
          openingWorkMinutes: -90,
          openingVacationDays: 2.5,
        }),
      );
    });

    it('aktualisiert einen bestehenden Saldo (Upsert) und reaktiviert ihn', async () => {
      periodRepo.findOne.mockResolvedValue({ id: 'per-1' });
      const existing = {
        id: 'bal-1',
        organizationId: 'org-1',
        employeeId: 'emp-1',
        periodId: 'per-1',
        openingWorkMinutes: 0,
        openingVacationDays: 0,
        isActive: false,
      };
      repo.findOne.mockResolvedValue(existing);

      const result = await service.upsert(input, 'org-1');

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'bal-1',
          openingWorkMinutes: -90,
          openingVacationDays: 2.5,
          isActive: true,
        }),
      );
      expect(result.id).toBe('bal-1');
    });
  });

  describe('remove', () => {
    it('wirft 404 für Salden fremder Organisationen', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('bal-1', 'org-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'bal-1', organizationId: 'org-1', isActive: true },
      });
    });

    it('deaktiviert den Saldo (Soft-Delete)', async () => {
      const existing = { id: 'bal-1', isActive: true };
      repo.findOne.mockResolvedValue(existing);

      await expect(service.remove('bal-1', 'org-1')).resolves.toBe(true);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'bal-1', isActive: false }),
      );
    });
  });
});
