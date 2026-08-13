import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import {
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { SystemEmployeeAbsenceCategory } from '../employee-absence-categories/interfaces/system-employee-absence-categories.enum';
import { AbsenceCalendarSyncService } from '../employee-absences/absence-calendar-sync.service';
import { EmployeeAbsence } from '../employee-absences/entities/employee-absence.entity';
import { EmployeeAbsenceDay } from '../employee-absences/entities/employee-absence-days.entity';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { SickLeaveNotificationService } from './sick-leave-notification.service';
import { SickLeaveService } from './sick-leave.service';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const EMPLOYEE_ID = 'employee-1';
const MEMBERSHIP_ID = 'membership-1';
const CATEGORY_ID = 'category-sickness';

const user = (overrides: Partial<TokenPayload> = {}): TokenPayload =>
  ({
    orgId: ORG_ID,
    membershipId: MEMBERSHIP_ID,
    ...overrides,
  }) as TokenPayload;

const membershipFixture = {
  id: MEMBERSHIP_ID,
  organizationId: ORG_ID,
  employee: { id: EMPLOYEE_ID },
  user: { firstName: 'Anna', lastName: 'Muster' },
};

const categoryFixture = {
  id: CATEGORY_ID,
  organizationId: ORG_ID,
  systemCode: SystemEmployeeAbsenceCategory.SICKNESS,
  isActive: true,
  defaultIsVacationCapable: false,
  defaultPercentage: 100,
};

/**
 * A day at UTC midnight — how absence dates are stored (`timestamptz`) and how
 * the service parses input. Building these in the local zone would let the
 * assertions pass against a service that silently shifts the day.
 */
const day = (year: number, month: number, dayOfMonth: number) =>
  new Date(Date.UTC(year, month - 1, dayOfMonth));

interface Candidate {
  id: string;
  organizationId: string;
  employeeId: string;
  startDate: Date;
  endDate: Date | null;
  note?: string | null;
  startTime?: string | null;
  absenceCategory?: { systemCode: string } | null;
}

describe('SickLeaveService', () => {
  let service: SickLeaveService;
  let entityManager: {
    findOne: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
    transaction: jest.Mock;
  };
  let periods: { assertRangeUnlocked: jest.Mock };
  let calendarSync: { sync: jest.Mock };
  let notifications: { notify: jest.Mock };
  let organizationSettings: { getDecryptedValue: jest.Mock };
  let balanceRecompute: { recomputeRange: jest.Mock };

  /** Rows returned by the merge-candidate query builder. */
  let mergeCandidates: Candidate[];
  /** Row returned by the overlap guard inside `create`. */
  let overlapping: unknown;
  /** Entities handed to `manager.save` inside a transaction. */
  let saved: Array<{ target: unknown; data: unknown }>;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    mergeCandidates = [];
    overlapping = null;
    saved = [];

    const makeQueryBuilder = () => {
      const qb: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn(() => qb),
        where: jest.fn(() => qb),
        andWhere: jest.fn(() => qb),
        orderBy: jest.fn(() => qb),
        limit: jest.fn(() => qb),
        getMany: jest.fn(() => Promise.resolve(mergeCandidates)),
        getOne: jest.fn(() => Promise.resolve(overlapping)),
      };
      return qb;
    };

    const transactionalManager = {
      findOne: jest.fn().mockResolvedValue({ id: ORG_ID }),
      createQueryBuilder: jest.fn(makeQueryBuilder),
      create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
      save: jest.fn().mockImplementation((target: unknown, data?: unknown) => {
        const payload = data ?? target;
        saved.push({ target, data: payload });
        return Promise.resolve(
          Array.isArray(payload)
            ? payload
            : { id: 'absence-new', ...(payload as object) },
        );
      }),
    };

    entityManager = {
      findOne: jest.fn().mockImplementation((entity: unknown) => {
        const name = (entity as { name?: string })?.name;
        if (name === 'Membership') return Promise.resolve(membershipFixture);
        if (name === 'EmployeeAbsenceCategory') {
          return Promise.resolve(categoryFixture);
        }
        return Promise.resolve(null);
      }),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(makeQueryBuilder),
      transaction: jest
        .fn()
        .mockImplementation((cb: (m: unknown) => Promise<unknown>) =>
          cb(transactionalManager),
        ),
    };

    periods = { assertRangeUnlocked: jest.fn().mockResolvedValue(undefined) };
    calendarSync = { sync: jest.fn().mockResolvedValue(undefined) };
    notifications = { notify: jest.fn().mockResolvedValue(undefined) };
    organizationSettings = {
      getDecryptedValue: jest.fn().mockResolvedValue(null),
    };
    balanceRecompute = {
      recomputeRange: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SickLeaveService,
        { provide: EntityManager, useValue: entityManager },
        { provide: TimeTrackingPeriodsService, useValue: periods },
        { provide: AbsenceCalendarSyncService, useValue: calendarSync },
        { provide: SickLeaveNotificationService, useValue: notifications },
        {
          provide: OrganizationSettingsService,
          useValue: organizationSettings,
        },
        { provide: BalanceRecomputeService, useValue: balanceRecompute },
      ],
    }).compile();

    service = module.get(SickLeaveService);
  });

  afterEach(() => jest.restoreAllMocks());

  const savedAbsences = () =>
    saved.filter(
      ({ target, data }) =>
        target === EmployeeAbsence ||
        (target !== EmployeeAbsenceDay &&
          typeof (data as { startDate?: unknown })?.startDate !== 'undefined'),
    );

  describe('tenant scoping', () => {
    it('resolves the membership from the token, scoped to its organization', async () => {
      await service.reportSickLeave({ date: '2026-03-02' }, user());

      const membershipCall = entityManager.findOne.mock.calls.find(
        (call) => (call[0] as { name?: string })?.name === 'Membership',
      );
      expect(membershipCall?.[1]).toEqual({
        where: { id: MEMBERSHIP_ID, organizationId: ORG_ID },
        relations: ['employee', 'user'],
      });
    });

    it('looks up the sickness category only within the caller organization', async () => {
      await service.reportSickLeave({ date: '2026-03-02' }, user());

      const categoryCall = entityManager.findOne.mock.calls.find(
        (call) =>
          (call[0] as { name?: string })?.name === 'EmployeeAbsenceCategory',
      );
      expect(categoryCall?.[1]).toEqual({
        where: {
          organizationId: ORG_ID,
          systemCode: SystemEmployeeAbsenceCategory.SICKNESS,
          isActive: true,
        },
      });
    });

    it('uses the token organization even when another org is in play', async () => {
      await service.reportSickLeave(
        { date: '2026-03-02' },
        user({ orgId: OTHER_ORG_ID }),
      );

      const membershipCall = entityManager.findOne.mock.calls.find(
        (call) => (call[0] as { name?: string })?.name === 'Membership',
      );
      expect(
        (membershipCall?.[1] as { where: { organizationId: string } }).where
          .organizationId,
      ).toBe(OTHER_ORG_ID);
    });

    it('rejects a caller whose membership does not exist in the organization', async () => {
      entityManager.findOne.mockImplementation((entity: unknown) =>
        Promise.resolve(
          (entity as { name?: string })?.name === 'Membership' ? null : null,
        ),
      );

      await expect(
        service.reportSickLeave({ date: '2026-03-02' }, user()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a membership without an employee record', async () => {
      entityManager.findOne.mockImplementation((entity: unknown) =>
        Promise.resolve(
          (entity as { name?: string })?.name === 'Membership'
            ? { id: MEMBERSHIP_ID, organizationId: ORG_ID, employee: null }
            : categoryFixture,
        ),
      );

      await expect(
        service.reportSickLeave({ date: '2026-03-02' }, user()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('preconditions', () => {
    it('fails clearly when the org has no sickness category', async () => {
      entityManager.findOne.mockImplementation((entity: unknown) =>
        Promise.resolve(
          (entity as { name?: string })?.name === 'Membership'
            ? membershipFixture
            : null,
        ),
      );

      await expect(
        service.reportSickLeave({ date: '2026-03-02' }, user()),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('rejects an unparseable date', async () => {
      await expect(
        service.reportSickLeave({ date: 'not-a-date' }, user()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to write into a locked period', async () => {
      periods.assertRangeUnlocked.mockRejectedValue(
        new BadRequestException('Period locked'),
      );

      await expect(
        service.reportSickLeave({ date: '2026-03-02' }, user()),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(entityManager.transaction).not.toHaveBeenCalled();
    });
  });

  describe('merge decision', () => {
    const sicknessCandidate = (
      start: Date,
      end: Date,
      overrides: Partial<Candidate> = {},
    ): Candidate => ({
      id: 'absence-existing',
      organizationId: ORG_ID,
      employeeId: EMPLOYEE_ID,
      startDate: start,
      endDate: end,
      note: null,
      absenceCategory: { systemCode: SystemEmployeeAbsenceCategory.SICKNESS },
      ...overrides,
    });

    it('is a no-op when the day is already covered', async () => {
      mergeCandidates = [sicknessCandidate(day(2026, 3, 2), day(2026, 3, 5))];

      const result = await service.reportSickLeave(
        { date: '2026-03-03' },
        user(),
      );

      expect(result.isUnchanged).toBe(true);
      expect(result.isExtension).toBe(false);
      expect(entityManager.transaction).not.toHaveBeenCalled();
    });

    it('notifies nobody and recomputes nothing on a duplicate report', async () => {
      mergeCandidates = [sicknessCandidate(day(2026, 3, 2), day(2026, 3, 5))];

      await service.reportSickLeave({ date: '2026-03-03' }, user());

      expect(notifications.notify).not.toHaveBeenCalled();
      expect(calendarSync.sync).not.toHaveBeenCalled();
      expect(balanceRecompute.recomputeRange).not.toHaveBeenCalled();
    });

    it('extends the existing absence on the very next day', async () => {
      // 2026-03-02 is a Monday, so 03-03 is the direct working-day follow-up.
      mergeCandidates = [sicknessCandidate(day(2026, 3, 2), day(2026, 3, 2))];

      const result = await service.reportSickLeave(
        { date: '2026-03-03' },
        user(),
      );

      expect(result.isExtension).toBe(true);
      expect(result.isUnchanged).toBe(false);
      expect(result.absence.endDate).toEqual(day(2026, 3, 3));
    });

    it('bridges a weekend between the last sick day and the new report', async () => {
      // Friday 2026-03-06 to Monday 2026-03-09: only Sat/Sun in between.
      mergeCandidates = [sicknessCandidate(day(2026, 3, 6), day(2026, 3, 6))];

      const result = await service.reportSickLeave(
        { date: '2026-03-09' },
        user(),
      );

      expect(result.isExtension).toBe(true);
      expect(result.absence.endDate).toEqual(day(2026, 3, 9));
    });

    it('creates a new absence when a working day lies in between', async () => {
      // Monday 2026-03-02 to Thursday 2026-03-05: Tue/Wed were working days.
      mergeCandidates = [sicknessCandidate(day(2026, 3, 2), day(2026, 3, 2))];

      const result = await service.reportSickLeave(
        { date: '2026-03-05' },
        user(),
      );

      expect(result.isExtension).toBe(false);
      expect(result.isUnchanged).toBe(false);
    });

    it('bridges a working day that is an org holiday', async () => {
      mergeCandidates = [sicknessCandidate(day(2026, 3, 2), day(2026, 3, 2))];
      entityManager.find.mockResolvedValue([
        { date: '2026-03-03', paidPercentage: 100, repeatsYearly: false },
        { date: '2026-03-04', paidPercentage: 100, repeatsYearly: false },
      ]);

      const result = await service.reportSickLeave(
        { date: '2026-03-05' },
        user(),
      );

      expect(result.isExtension).toBe(true);
    });

    it('ignores a non-mergeable category and creates a fresh absence', async () => {
      mergeCandidates = [
        sicknessCandidate(day(2026, 3, 2), day(2026, 3, 2), {
          absenceCategory: { systemCode: 'VACATION' },
        }),
      ];

      const result = await service.reportSickLeave(
        { date: '2026-03-03' },
        user(),
      );

      expect(result.isExtension).toBe(false);
    });

    it('merges into an accident absence as well', async () => {
      mergeCandidates = [
        sicknessCandidate(day(2026, 3, 2), day(2026, 3, 2), {
          absenceCategory: {
            systemCode: SystemEmployeeAbsenceCategory.ACCIDENT,
          },
        }),
      ];

      const result = await service.reportSickLeave(
        { date: '2026-03-03' },
        user(),
      );

      expect(result.isExtension).toBe(true);
    });

    it('backfills the absence days covered by an extension', async () => {
      mergeCandidates = [sicknessCandidate(day(2026, 3, 6), day(2026, 3, 6))];

      await service.reportSickLeave({ date: '2026-03-09' }, user());

      const dayBatch = saved.find(
        ({ target }) => target === EmployeeAbsenceDay,
      );
      expect(Array.isArray(dayBatch?.data)).toBe(true);
      expect(dayBatch?.data as unknown[]).toHaveLength(3); // Sa, So, Mo
    });

    it('keeps the original start time when extending', async () => {
      mergeCandidates = [
        sicknessCandidate(day(2026, 3, 2), day(2026, 3, 2), {
          startTime: '13:00:00',
        }),
      ];

      const result = await service.reportSickLeave(
        { date: '2026-03-03', startTime: '08:00' },
        user(),
      );

      expect(result.absence.startTime).toBe('13:00:00');
    });

    it('appends each comment with a date prefix instead of overwriting', async () => {
      mergeCandidates = [
        sicknessCandidate(day(2026, 3, 2), day(2026, 3, 2), {
          note: '02.03.2026: Fieber',
        }),
      ];

      const result = await service.reportSickLeave(
        { date: '2026-03-03', comment: 'Immer noch krank' },
        user(),
      );

      expect(result.absence.note).toBe(
        '02.03.2026: Fieber\n03.03.2026: Immer noch krank',
      );
    });
  });

  describe('date handling (regression: day shifted by timezone)', () => {
    it('stores the reported day as UTC midnight, not local midnight', async () => {
      // `startDate`/`endDate` are `timestamptz` and the regular absence flow
      // writes `new Date('YYYY-MM-DD')` = UTC midnight. Parsing in the server's
      // local zone stored the PREVIOUS day east of UTC, so the same calendar
      // day compared unequal between the two flows.
      await service.reportSickLeave({ date: '2026-08-20' }, user());

      const absence = savedAbsences()[0]?.data as {
        startDate: Date;
        endDate: Date;
      };
      expect(absence.startDate.toISOString()).toBe('2026-08-20T00:00:00.000Z');
      expect(absence.endDate.toISOString()).toBe('2026-08-20T00:00:00.000Z');
    });

    it('recomputes balances for the reported day, not its neighbour', async () => {
      await service.reportSickLeave({ date: '2026-08-20' }, user());

      expect(balanceRecompute.recomputeRange).toHaveBeenCalledWith(
        ORG_ID,
        EMPLOYEE_ID,
        '2026-08-20',
        '2026-08-20',
      );
    });

    it('records the absence day on the reported date', async () => {
      await service.reportSickLeave({ date: '2026-08-20' }, user());

      const dayEntry = saved.find(
        ({ target }) => target === EmployeeAbsenceDay,
      );
      expect((dayEntry?.data as { date: string }).date).toBe('2026-08-20');
    });

    it('prefixes the comment with the reported day', async () => {
      const result = await service.reportSickLeave(
        { date: '2026-08-20', comment: 'Fieber' },
        user(),
      );

      expect(result.absence.note).toBe('20.08.2026: Fieber');
    });
  });

  describe('create', () => {
    it('stores the start time with seconds when one was reported', async () => {
      await service.reportSickLeave(
        { date: '2026-03-02', startTime: '13:00' },
        user(),
      );

      const absence = savedAbsences()[0]?.data as { startTime?: string | null };
      expect(absence.startTime).toBe('13:00:00');
    });

    it('leaves the start time unset for a whole-day report', async () => {
      await service.reportSickLeave({ date: '2026-03-02' }, user());

      const absence = savedAbsences()[0]?.data as { startTime?: string | null };
      expect(absence.startTime).toBeNull();
    });

    it('records a single absence day for a fresh report', async () => {
      await service.reportSickLeave({ date: '2026-03-02' }, user());

      const dayEntry = saved.find(
        ({ target }) => target === EmployeeAbsenceDay,
      );
      expect(dayEntry).toBeDefined();
    });

    it('keeps the overlap guard for a non-mergeable existing absence', async () => {
      overlapping = { id: 'absence-vacation' };

      await expect(
        service.reportSickLeave({ date: '2026-03-02' }, user()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('balances', () => {
    it('recomputes the range so the absence reaches the time views', async () => {
      await service.reportSickLeave({ date: '2026-03-02' }, user());

      expect(balanceRecompute.recomputeRange).toHaveBeenCalledWith(
        ORG_ID,
        EMPLOYEE_ID,
        '2026-03-02',
        '2026-03-02',
      );
    });

    it('recomputes from the original start date when extending', async () => {
      mergeCandidates = [
        {
          id: 'absence-existing',
          organizationId: ORG_ID,
          employeeId: EMPLOYEE_ID,
          startDate: day(2026, 3, 2),
          endDate: day(2026, 3, 2),
          absenceCategory: {
            systemCode: SystemEmployeeAbsenceCategory.SICKNESS,
          },
        },
      ];

      await service.reportSickLeave({ date: '2026-03-03' }, user());

      expect(balanceRecompute.recomputeRange).toHaveBeenCalledWith(
        ORG_ID,
        EMPLOYEE_ID,
        '2026-03-02',
        '2026-03-03',
      );
    });
  });

  describe('side effects', () => {
    it('notifies leadership after a fresh report', async () => {
      await service.reportSickLeave(
        { date: '2026-03-02', comment: 'Grippe' },
        user(),
      );

      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          employeeId: EMPLOYEE_ID,
          employeeName: 'Anna Muster',
          comment: 'Grippe',
          isExtension: false,
        }),
      );
    });

    it('mirrors the absence to the calendar when the org enabled it', async () => {
      await service.reportSickLeave({ date: '2026-03-02' }, user());

      expect(calendarSync.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          employeeName: 'Anna Muster',
        }),
      );
    });

    it('skips the calendar when the org switched it off', async () => {
      organizationSettings.getDecryptedValue.mockResolvedValue('false');

      await service.reportSickLeave({ date: '2026-03-02' }, user());

      expect(calendarSync.sync).not.toHaveBeenCalled();
      expect(notifications.notify).toHaveBeenCalled();
    });

    it('still sends mails when the calendar sync throws', async () => {
      calendarSync.sync.mockRejectedValue(new Error('calendar down'));

      await expect(
        service.reportSickLeave({ date: '2026-03-02' }, user()),
      ).resolves.toEqual(expect.objectContaining({ isUnchanged: false }));
      expect(notifications.notify).toHaveBeenCalled();
    });

    it('does not fail the report when notifications throw', async () => {
      notifications.notify.mockRejectedValue(new Error('smtp down'));

      await expect(
        service.reportSickLeave({ date: '2026-03-02' }, user()),
      ).resolves.toEqual(expect.objectContaining({ isUnchanged: false }));
    });

    it('treats an unreadable calendar toggle as disabled', async () => {
      organizationSettings.getDecryptedValue.mockRejectedValue(
        new Error('settings unavailable'),
      );

      await service.reportSickLeave({ date: '2026-03-02' }, user());

      expect(calendarSync.sync).not.toHaveBeenCalled();
    });
  });
});
