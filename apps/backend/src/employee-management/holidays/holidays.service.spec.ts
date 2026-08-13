import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { HolidaysService } from './holidays.service';
import { Holiday } from './entities/holiday.entity';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { CompanyVacationsService } from '../company-vacations/company-vacations.service';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';

describe('HolidaysService', () => {
  let service: HolidaysService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let recompute: { recomputeOrgRange: jest.Mock };
  let companyVacations: { recomputeEffectiveDaysForOrg: jest.Mock };
  let periods: { getAnchor: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((e) => e),
      save: jest
        .fn()
        .mockImplementation((e) =>
          Promise.resolve({ id: 'h-1', isActive: true, ...e }),
        ),
    };
    recompute = { recomputeOrgRange: jest.fn().mockResolvedValue(undefined) };
    companyVacations = {
      recomputeEffectiveDaysForOrg: jest.fn().mockResolvedValue(undefined),
    };
    periods = {
      getAnchor: jest.fn().mockResolvedValue({ month: 1, day: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HolidaysService,
        { provide: getRepositoryToken(Holiday), useValue: repo },
        { provide: BalanceRecomputeService, useValue: recompute },
        { provide: CompanyVacationsService, useValue: companyVacations },
        { provide: TimeTrackingPeriodsService, useValue: periods },
      ],
    }).compile();

    service = module.get(HolidaysService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findAll', () => {
    it('scopes to active holidays of the organization', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll('org-1');
      expect(repo.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', isActive: true },
        order: { date: 'ASC' },
      });
    });

    it('sorts holidays starting from the org period anchor, not calendar order', async () => {
      periods.getAnchor.mockResolvedValue({ month: 8, day: 1 });
      repo.find.mockResolvedValue([
        { id: 'h-jan', date: '2026-01-15' },
        { id: 'h-dec', date: '2026-12-25' },
        { id: 'h-aug', date: '2026-08-01' },
      ]);

      const result = await service.findAll('org-1');

      expect(periods.getAnchor).toHaveBeenCalledWith('org-1');
      // Anchor 08-01: August/December come before the following January.
      expect(result.map((h) => h.id)).toEqual(['h-aug', 'h-dec', 'h-jan']);
    });
  });

  describe('create', () => {
    it('defaults paidPercentage and repeatsYearly', async () => {
      const saved = await service.create(
        { date: '2026-08-01', name: 'Nationalfeiertag' },
        'org-1',
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-08-01',
          name: 'Nationalfeiertag',
          paidPercentage: 100,
          repeatsYearly: false,
          organizationId: 'org-1',
        }),
      );
      expect(saved.organizationId).toBe('org-1');
      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        'org-1',
        '2026-08-01',
        '2026-08-01',
      );
      expect(
        companyVacations.recomputeEffectiveDaysForOrg,
      ).toHaveBeenCalledWith('org-1');
    });

    it('recomputes the full year range for yearly holidays', async () => {
      const fixedNow = DateTime.fromISO('2026-08-04T12:00:00', {
        zone: 'Europe/Zurich',
      });
      if (!fixedNow.isValid) throw new Error('invalid DateTime fixture');
      // isValid narrows for the ESLint type-checker but not for ts-jest's isolated
      // program, so the assertion is required there even though it looks redundant.

      jest.spyOn(DateTime, 'now').mockReturnValue(fixedNow as DateTime<true>);

      await service.create(
        {
          date: '2020-08-01',
          name: 'Nationalfeiertag',
          repeatsYearly: true,
        },
        'org-1',
      );

      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        'org-1',
        '2020-01-01',
        '2027-12-31',
      );
    });

    it('includes the current year when the yearly anchor is in the future', async () => {
      const fixedNow = DateTime.fromISO('2026-08-04T12:00:00', {
        zone: 'Europe/Zurich',
      });
      if (!fixedNow.isValid) throw new Error('invalid DateTime fixture');
      // isValid narrows for the ESLint type-checker but not for ts-jest's isolated
      // program, so the assertion is required there even though it looks redundant.

      jest.spyOn(DateTime, 'now').mockReturnValue(fixedNow as DateTime<true>);

      await service.create(
        {
          date: '2027-08-01',
          name: 'Nationalfeiertag',
          repeatsYearly: true,
        },
        'org-1',
      );

      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        'org-1',
        '2026-01-01',
        '2027-12-31',
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException for a foreign-org holiday', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update({ id: 'h-foreign', name: 'X' }, 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'h-foreign', organizationId: 'org-1', isActive: true },
      });
      expect(recompute.recomputeOrgRange).not.toHaveBeenCalled();
    });

    it('recomputes the union of previous and new one-off dates', async () => {
      repo.findOne.mockResolvedValue({
        id: 'h-1',
        organizationId: 'org-1',
        date: '2026-06-01',
        name: 'Alt',
        paidPercentage: 100,
        repeatsYearly: false,
        isActive: true,
      });

      await service.update(
        { id: 'h-1', date: '2026-08-01', name: 'Neu' },
        'org-1',
      );

      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        'org-1',
        '2026-06-01',
        '2026-08-01',
      );
      expect(
        companyVacations.recomputeEffectiveDaysForOrg,
      ).toHaveBeenCalledWith('org-1');
    });

    it('expands to year range when toggling to yearly', async () => {
      const fixedNow = DateTime.fromISO('2026-03-01T12:00:00', {
        zone: 'Europe/Zurich',
      });
      if (!fixedNow.isValid) throw new Error('invalid DateTime fixture');
      // isValid narrows for the ESLint type-checker but not for ts-jest's isolated
      // program, so the assertion is required there even though it looks redundant.

      jest.spyOn(DateTime, 'now').mockReturnValue(fixedNow as DateTime<true>);

      repo.findOne.mockResolvedValue({
        id: 'h-1',
        organizationId: 'org-1',
        date: '2026-08-01',
        name: 'Nationalfeiertag',
        paidPercentage: 100,
        repeatsYearly: false,
        isActive: true,
      });

      await service.update({ id: 'h-1', repeatsYearly: true }, 'org-1');

      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        'org-1',
        '2026-01-01',
        '2027-12-31',
      );
      expect(
        companyVacations.recomputeEffectiveDaysForOrg,
      ).toHaveBeenCalledWith('org-1');
    });
  });

  describe('remove', () => {
    it('soft-deletes and recomputes the one-off day', async () => {
      repo.findOne.mockResolvedValue({
        id: 'h-1',
        organizationId: 'org-1',
        date: '2026-08-01',
        name: 'Nationalfeiertag',
        paidPercentage: 100,
        repeatsYearly: false,
        isActive: true,
      });

      await expect(service.remove('h-1', 'org-1')).resolves.toBe(true);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'h-1', isActive: false }),
      );
      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        'org-1',
        '2026-08-01',
        '2026-08-01',
      );
      expect(
        companyVacations.recomputeEffectiveDaysForOrg,
      ).toHaveBeenCalledWith('org-1');
    });

    it('throws NotFoundException for a foreign-org holiday', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('h-foreign', 'org-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(recompute.recomputeOrgRange).not.toHaveBeenCalled();
      expect(
        companyVacations.recomputeEffectiveDaysForOrg,
      ).not.toHaveBeenCalled();
    });
  });
});
