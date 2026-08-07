import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTracking } from './entities/time-tracking.entity';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

const user = { orgId: 'org-1' } as unknown as TokenPayload;

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let repo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let access: {
    assertCanManageEmployee: jest.Mock;
    assertCanViewEmployee: jest.Mock;
  };
  let periods: { assertRangeUnlocked: jest.Mock };
  let recompute: { recomputeRange: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      create: jest.fn().mockImplementation((e) => e),
    };
    access = {
      assertCanManageEmployee: jest.fn().mockResolvedValue(undefined),
      assertCanViewEmployee: jest.fn().mockResolvedValue(undefined),
    };
    periods = { assertRangeUnlocked: jest.fn().mockResolvedValue(undefined) };
    recompute = { recomputeRange: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeTrackingService,
        { provide: getRepositoryToken(TimeTracking), useValue: repo },
        { provide: BalanceRecomputeService, useValue: recompute },
        { provide: TimeTrackingAccessService, useValue: access },
        { provide: TimeTrackingPeriodsService, useValue: periods },
      ],
    }).compile();

    service = module.get(TimeTrackingService);
  });

  describe('update', () => {
    const existing = () => ({
      id: 'tt-1',
      organizationId: 'org-1',
      employeeId: 'emp-1',
      startedAt: new Date('2026-06-01T08:00:00Z'),
      endedAt: new Date('2026-06-01T17:00:00Z'),
      breakMinutes: 30,
      entryDate: '2026-06-01',
      isActive: true,
    });

    it('ignoriert employeeId im Input (kein Umhängen auf fremde Mitarbeiter)', async () => {
      repo.findOne.mockResolvedValue(existing());
      const saved = await service.update(
        { id: 'tt-1', employeeId: 'emp-EVIL', notes: 'x' },
        'org-1',
        user,
      );
      expect(saved.employeeId).toBe('emp-1');
      expect(access.assertCanManageEmployee).toHaveBeenCalledWith(
        user,
        'emp-1',
      );
    });

    it('blockiert Updates in gesperrter Periode', async () => {
      repo.findOne.mockResolvedValue(existing());
      periods.assertRangeUnlocked.mockRejectedValue(
        new BadRequestException('gesperrt'),
      );
      await expect(
        service.update({ id: 'tt-1', notes: 'x' }, 'org-1', user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('blockiert Erfassung in gesperrter Periode', async () => {
      periods.assertRangeUnlocked.mockRejectedValue(
        new BadRequestException('gesperrt'),
      );
      await expect(
        service.create(
          { employeeId: 'emp-1', startedAt: '2026-06-01T08:00:00Z' },
          'org-1',
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('setzt createdById auf den erfassenden User', async () => {
      repo.findOne.mockResolvedValue(null);
      const withSub = { orgId: 'org-1', sub: 'creator-1' } as TokenPayload;
      const saved = await service.create(
        { employeeId: 'emp-1', startedAt: '2026-06-01T08:00:00Z' },
        'org-1',
        withSub,
      );
      expect(saved.createdById).toBe('creator-1');
    });

    it('blockiert Zweiteintrag am selben Tag (regression: mehrere aktive Einträge pro Tag)', async () => {
      repo.findOne.mockResolvedValue({
        id: 'existing-tt',
        entryDate: '2026-06-01',
        isActive: true,
      });
      await expect(
        service.create(
          { employeeId: 'emp-1', startedAt: '2026-06-01T08:00:00Z' },
          'org-1',
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('blockiert Clock-In, wenn für heute schon ein Eintrag existiert', async () => {
      repo.findOne
        .mockResolvedValueOnce(null) // openEntry check
        .mockResolvedValueOnce({
          id: 'existing-tt',
          entryDate: new Date().toISOString().slice(0, 10),
          isActive: true,
        }); // duplicate-day check
      await expect(
        service.start('emp-1', 'org-1', user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('update — Zweiteintrag am Zieltag', () => {
    const existing = () => ({
      id: 'tt-1',
      organizationId: 'org-1',
      employeeId: 'emp-1',
      startedAt: new Date('2026-06-01T08:00:00Z'),
      endedAt: new Date('2026-06-01T17:00:00Z'),
      breakMinutes: 30,
      entryDate: '2026-06-01',
      isActive: true,
    });

    it('blockiert Verschieben auf einen Tag mit bereits aktivem Eintrag', async () => {
      repo.findOne
        .mockResolvedValueOnce(existing()) // load entry to update
        .mockResolvedValueOnce({
          id: 'other-tt',
          entryDate: '2026-06-02',
          isActive: true,
        }); // duplicate-day check for new date
      await expect(
        service.update(
          { id: 'tt-1', startedAt: '2026-06-02T08:00:00Z' },
          'org-1',
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('erlaubt Update ohne Tageswechsel trotz gleichem Eintrag als "Duplikat"', async () => {
      repo.findOne.mockResolvedValueOnce(existing());
      const saved = await service.update(
        { id: 'tt-1', notes: 'geändert' },
        'org-1',
        user,
      );
      expect(saved.notes).toBe('geändert');
      expect(repo.save).toHaveBeenCalled();
    });
  });
});
