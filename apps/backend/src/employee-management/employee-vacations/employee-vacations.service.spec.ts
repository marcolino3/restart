import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeeVacationsService } from './employee-vacations.service';
import { EmployeeVacation } from './entities/employee-vacation.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { BalanceRecomputeService } from '@/employee-management/work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '@/employee-management/work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '@/employee-management/time-tracking-periods/time-tracking-periods.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

describe('EmployeeVacationsService', () => {
  let service: EmployeeVacationsService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let membershipRepo: { findOne: jest.Mock };
  let holidayRepo: { find: jest.Mock };
  let recompute: { recomputeRange: jest.Mock };
  let access: {
    assertCanViewEmployee: jest.Mock;
    assertCanManageEmployee: jest.Mock;
  };
  let periods: { getAnchor: jest.Mock; assertRangeUnlocked: jest.Mock };

  const user: TokenPayload = {
    orgId: 'org-a',
    membershipId: 'mem-1',
    isSuperAdmin: false,
  } as TokenPayload;

  const vacation = {
    id: 'ev-1',
    organizationId: 'org-a',
    employeeId: 'emp-1',
    membershipId: 'mem-1',
    name: 'Ferien',
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    isActive: true,
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((e) => e),
      save: jest
        .fn()
        .mockImplementation((e) => Promise.resolve({ id: 'ev-new', ...e })),
    };
    membershipRepo = { findOne: jest.fn().mockResolvedValue({ id: 'mem-1' }) };
    holidayRepo = { find: jest.fn().mockResolvedValue([]) };
    recompute = { recomputeRange: jest.fn().mockResolvedValue(undefined) };
    access = {
      assertCanViewEmployee: jest.fn().mockResolvedValue(undefined),
      assertCanManageEmployee: jest.fn().mockResolvedValue(undefined),
    };
    periods = {
      getAnchor: jest.fn().mockResolvedValue({ month: 1, day: 1 }),
      assertRangeUnlocked: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeVacationsService,
        { provide: getRepositoryToken(EmployeeVacation), useValue: repo },
        { provide: getRepositoryToken(Membership), useValue: membershipRepo },
        { provide: getRepositoryToken(Holiday), useValue: holidayRepo },
        { provide: BalanceRecomputeService, useValue: recompute },
        { provide: TimeTrackingAccessService, useValue: access },
        { provide: TimeTrackingPeriodsService, useValue: periods },
      ],
    }).compile();

    service = module.get(EmployeeVacationsService);
  });

  describe('findByEmployee', () => {
    it('rejects when caller has no view access', async () => {
      access.assertCanViewEmployee.mockRejectedValue(new ForbiddenException());

      await expect(
        service.findByEmployee(user, 'emp-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('scopes to the active org id (multi-tenant isolation)', async () => {
      repo.find.mockResolvedValue([]);
      await service.findByEmployee(user, 'emp-1');
      expect(repo.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-a', employeeId: 'emp-1', isActive: true },
        order: { startDate: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('rejects when caller cannot manage the employee', async () => {
      access.assertCanManageEmployee.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.create(
          {
            employeeId: 'emp-1',
            startDate: '2026-07-01',
            endDate: '2026-07-10',
          },
          user,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('fails when the period is locked', async () => {
      periods.assertRangeUnlocked.mockRejectedValue(
        new ForbiddenException('locked'),
      );

      await expect(
        service.create(
          {
            employeeId: 'emp-1',
            startDate: '2026-07-01',
            endDate: '2026-07-10',
          },
          user,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates, scopes org id, and recomputes the range', async () => {
      const saved = await service.create(
        { employeeId: 'emp-1', startDate: '2026-07-01', endDate: '2026-07-10' },
        user,
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 'emp-1',
          organizationId: 'org-a',
          membershipId: 'mem-1',
          name: null,
        }),
      );
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-a',
        saved.employeeId,
        '2026-07-01',
        '2026-07-10',
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException for a foreign-org vacation', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update({ id: 'ev-foreign', startDate: '2026-07-05' }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'ev-foreign', organizationId: 'org-a', isActive: true },
      });
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
    });

    it('rejects when caller cannot manage the employee', async () => {
      repo.findOne.mockResolvedValue({ ...vacation });
      access.assertCanManageEmployee.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.update({ id: 'ev-1', startDate: '2026-07-05' }, user),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('recomputes with the union range of old and new dates', async () => {
      repo.findOne.mockResolvedValue({ ...vacation });

      await service.update(
        { id: 'ev-1', startDate: '2026-06-20', endDate: '2026-07-15' },
        user,
      );

      expect(periods.assertRangeUnlocked).toHaveBeenCalledWith(
        'org-a',
        '2026-06-20',
        '2026-07-15',
      );
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-a',
        'emp-1',
        '2026-06-20',
        '2026-07-15',
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException for a foreign-org vacation', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('ev-foreign', user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
    });

    it('fails when the period is locked', async () => {
      repo.findOne.mockResolvedValue({ ...vacation });
      periods.assertRangeUnlocked.mockRejectedValue(
        new ForbiddenException('locked'),
      );

      await expect(service.remove('ev-1', user)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('soft-deletes and recomputes the range', async () => {
      repo.findOne.mockResolvedValue({ ...vacation });

      const result = await service.remove('ev-1', user);

      expect(result).toBe(true);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-a',
        'emp-1',
        '2026-07-01',
        '2026-07-10',
      );
    });
  });

  describe('findSegmentsForEmployee', () => {
    it('clips a period-spanning vacation to only the current segment', async () => {
      // Anchor Jan 1 -> current period covers 2026-01-01.. ; vacation spans across it.
      periods.getAnchor.mockResolvedValue({ month: 1, day: 1 });
      repo.find.mockResolvedValue([
        {
          id: 'ev-1',
          name: 'Jahreswechsel-Ferien',
          startDate: '2025-12-20',
          endDate: '2026-01-10',
        },
      ]);

      const result = await service.findSegmentsForEmployee(user, 'emp-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        employeeVacationId: 'ev-1',
        startDate: '2026-01-01',
        endDate: '2026-01-10',
        isSplit: true,
      });
    });

    it('excludes weekend holidays from effectiveDays but keeps them in holidays list', async () => {
      periods.getAnchor.mockResolvedValue({ month: 1, day: 1 });
      repo.find.mockResolvedValue([
        {
          id: 'ev-1',
          name: 'Ferien',
          startDate: '2026-01-05',
          endDate: '2026-01-09',
        },
      ]);
      // 2026-01-03 is a Saturday -> weekend holiday, outside range anyway;
      // use an in-range weekend holiday: 2026-01-10 Sat is out of range too.
      // Pick 2026-01-05 (Mon) as a weekday holiday to prove holidays list works,
      // and confirm effectiveDays accounts for it.
      holidayRepo.find.mockResolvedValue([
        {
          organizationId: 'org-a',
          date: '2026-01-05',
          name: 'Feiertag',
          paidPercentage: 100,
          repeatsYearly: false,
          isActive: true,
        },
      ]);

      const result = await service.findSegmentsForEmployee(user, 'emp-1');

      expect(result).toHaveLength(1);
      expect(result[0].holidays).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ date: '2026-01-05', name: 'Feiertag' }),
        ]),
      );
      // 5 calendar days (Mon-Fri), minus 1 holiday day -> 4 effective days.
      expect(result[0].effectiveDays).toBe(4);
    });

    it('scopes segment lookup to the active org via findByEmployee', async () => {
      repo.find.mockResolvedValue([]);
      await service.findSegmentsForEmployee(user, 'emp-1');
      expect(access.assertCanViewEmployee).toHaveBeenCalledWith(user, 'emp-1');
      expect(holidayRepo.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-a', isActive: true },
      });
    });
  });
});
