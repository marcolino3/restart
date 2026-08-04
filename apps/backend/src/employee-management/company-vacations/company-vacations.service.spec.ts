import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CompanyVacationsService } from './company-vacations.service';
import { CompanyVacation } from './entities/company-vacation.entity';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';

describe('CompanyVacationsService', () => {
  let service: CompanyVacationsService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let recompute: { recomputeOrgRange: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((e) => e),
      save: jest
        .fn()
        .mockImplementation((e) =>
          Promise.resolve({ id: 'cv-1', isActive: true, ...e }),
        ),
    };
    recompute = { recomputeOrgRange: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyVacationsService,
        { provide: getRepositoryToken(CompanyVacation), useValue: repo },
        { provide: BalanceRecomputeService, useValue: recompute },
      ],
    }).compile();

    service = module.get(CompanyVacationsService);
  });

  describe('findAll', () => {
    it('scopes to active vacations of the organization', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll('org-1');
      expect(repo.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', isActive: true },
        order: { startDate: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('defaults appliesToAll and recomputes the date range', async () => {
      await service.create(
        {
          name: 'Sommerferien',
          startDate: '2026-07-01',
          endDate: '2026-08-15',
        },
        'org-1',
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sommerferien',
          startDate: '2026-07-01',
          endDate: '2026-08-15',
          appliesToAll: true,
          organizationId: 'org-1',
        }),
      );
      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        'org-1',
        '2026-07-01',
        '2026-08-15',
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException for a foreign-org vacation', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update({ id: 'cv-foreign', name: 'X' }, 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'cv-foreign', organizationId: 'org-1', isActive: true },
      });
      expect(recompute.recomputeOrgRange).not.toHaveBeenCalled();
    });

    it('recomputes the union of previous and new ranges', async () => {
      repo.findOne.mockResolvedValue({
        id: 'cv-1',
        organizationId: 'org-1',
        name: 'Sommerferien',
        startDate: '2026-07-01',
        endDate: '2026-08-15',
        appliesToAll: true,
        isActive: true,
      });

      await service.update(
        {
          id: 'cv-1',
          startDate: '2026-07-10',
          endDate: '2026-08-31',
        },
        'org-1',
      );

      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        'org-1',
        '2026-07-01',
        '2026-08-31',
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes and recomputes the vacation range', async () => {
      repo.findOne.mockResolvedValue({
        id: 'cv-1',
        organizationId: 'org-1',
        name: 'Sommerferien',
        startDate: '2026-07-01',
        endDate: '2026-08-15',
        appliesToAll: true,
        isActive: true,
      });

      await expect(service.remove('cv-1', 'org-1')).resolves.toBe(true);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cv-1', isActive: false }),
      );
      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        'org-1',
        '2026-07-01',
        '2026-08-15',
      );
    });

    it('throws NotFoundException for a foreign-org vacation', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.remove('cv-foreign', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(recompute.recomputeOrgRange).not.toHaveBeenCalled();
    });
  });
});
