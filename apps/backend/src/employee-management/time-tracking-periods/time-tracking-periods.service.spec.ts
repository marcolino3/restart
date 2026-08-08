import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TimeTrackingPeriodsService } from './time-tracking-periods.service';
import {
  TimeTrackingPeriod,
  TimeTrackingPeriodStatus,
} from './entities/time-tracking-period.entity';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';

describe('TimeTrackingPeriodsService', () => {
  let service: TimeTrackingPeriodsService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let orgSettings: {
    getDecryptedValue: jest.Mock;
    setDecryptedValue: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((e) => e),
      save: jest
        .fn()
        .mockImplementation((e) => Promise.resolve({ id: 'period-1', ...e })),
    };
    orgSettings = {
      getDecryptedValue: jest.fn(),
      setDecryptedValue: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeTrackingPeriodsService,
        { provide: getRepositoryToken(TimeTrackingPeriod), useValue: repo },
        { provide: OrganizationSettingsService, useValue: orgSettings },
      ],
    }).compile();

    service = module.get(TimeTrackingPeriodsService);
  });

  describe('findAll', () => {
    it('scopes to the active org id and only active periods', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll('org-a');
      expect(repo.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-a', isActive: true },
        order: { startDate: 'DESC' },
      });
    });
  });

  describe('getAnchor / getAnchorValue', () => {
    it('falls back to 01-01 when no setting exists', async () => {
      orgSettings.getDecryptedValue.mockResolvedValue(null);
      expect(await service.getAnchor('org-a')).toEqual({ month: 1, day: 1 });
      expect(await service.getAnchorValue('org-a')).toBe('01-01');
    });

    it('falls back to 01-01 when the stored value is malformed', async () => {
      orgSettings.getDecryptedValue.mockResolvedValue('garbage');
      expect(await service.getAnchor('org-a')).toEqual({ month: 1, day: 1 });
    });

    it('falls back the day when only the day is malformed', async () => {
      orgSettings.getDecryptedValue.mockResolvedValue('08-99');
      expect(await service.getAnchor('org-a')).toEqual({ month: 8, day: 1 });
    });

    it('returns the stored MM-DD anchor', async () => {
      orgSettings.getDecryptedValue.mockResolvedValue('08-15');
      expect(await service.getAnchor('org-a')).toEqual({ month: 8, day: 15 });
      expect(await service.getAnchorValue('org-a')).toBe('08-15');
    });
  });

  describe('setAnchorValue', () => {
    it('persists a valid MM-DD anchor', async () => {
      const result = await service.setAnchorValue('org-a', '08-15');
      expect(result).toBe('08-15');
      expect(orgSettings.setDecryptedValue).toHaveBeenCalledWith(
        'org-a',
        'TIMETRACKING_PERIOD_ANCHOR',
        '08-15',
        expect.any(String),
      );
    });

    it('trims surrounding whitespace before validating', async () => {
      const result = await service.setAnchorValue('org-a', '  08-05  ');
      expect(result).toBe('08-05');
    });

    it.each([
      '',
      '8-5',
      '13-01',
      '00-01',
      '01-00',
      '01-32',
      'abc',
      '02-30',
      '02-29',
    ])('rejects invalid format/value %s', async (value) => {
      await expect(
        service.setAnchorValue('org-a', value),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(orgSettings.setDecryptedValue).not.toHaveBeenCalled();
    });
  });

  describe('ensurePeriodForDate', () => {
    it('creates a new period when none exists yet', async () => {
      orgSettings.getDecryptedValue.mockResolvedValue('01-01');
      repo.findOne.mockResolvedValue(null);

      const result = await service.ensurePeriodForDate('org-a', '2026-05-15');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-a',
          startDate: '2026-01-01',
          isActive: true,
        },
      });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-a',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          status: TimeTrackingPeriodStatus.OPEN,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({ startDate: '2026-01-01' }),
      );
    });

    it('is idempotent: a second call for a date in the same period does not create a new one', async () => {
      orgSettings.getDecryptedValue.mockResolvedValue('01-01');
      const existing = {
        id: 'period-existing',
        organizationId: 'org-a',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      };
      repo.findOne.mockResolvedValue(existing);

      const result = await service.ensurePeriodForDate('org-a', '2026-06-01');

      expect(result).toBe(existing);
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('assertRangeUnlocked', () => {
    it('throws BadRequestException when the range overlaps a locked period', async () => {
      repo.findOne.mockResolvedValue({
        id: 'period-locked',
        label: '2026',
        status: TimeTrackingPeriodStatus.LOCKED,
      });

      await expect(
        service.assertRangeUnlocked('org-a', '2026-03-01', '2026-03-10'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('does not throw when no locked period overlaps the range', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.assertRangeUnlocked('org-a', '2026-03-01', '2026-03-10'),
      ).resolves.toBeUndefined();

      expect(repo.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-a',
          isActive: true,
          status: TimeTrackingPeriodStatus.LOCKED,
        }),
      });
    });
  });

  describe('setStatus', () => {
    it('throws NotFoundException when the period does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.setStatus('period-1', 'org-a', TimeTrackingPeriodStatus.LOCKED),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a foreign-org period id (multi-tenant isolation)', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.setStatus('period-1', 'org-b', TimeTrackingPeriodStatus.LOCKED),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'period-1', organizationId: 'org-b', isActive: true },
      });
    });

    it('updates and persists the status when found', async () => {
      const period = {
        id: 'period-1',
        organizationId: 'org-a',
        status: TimeTrackingPeriodStatus.OPEN,
      };
      repo.findOne.mockResolvedValue(period);

      const result = await service.setStatus(
        'period-1',
        'org-a',
        TimeTrackingPeriodStatus.LOCKED,
      );

      expect(result.status).toBe(TimeTrackingPeriodStatus.LOCKED);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TimeTrackingPeriodStatus.LOCKED }),
      );
    });
  });
});
