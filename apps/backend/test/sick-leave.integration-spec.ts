/**
 * Integration tests for SickLeaveService against a real PostgreSQL database.
 *
 * The unit specs mock the EntityManager, so they can only prove that the
 * service asks for the right things. What they cannot prove is what actually
 * lands in Postgres — and that is exactly where this feature was bitten once:
 * `startDate`/`endDate` are `timestamptz`, and writing a locally-parsed
 * midnight stored the previous day east of UTC. These tests read the columns
 * back to check the stored values, the merge behaviour across a real query
 * builder, and multi-tenant isolation.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=sick-leave
 */
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';

import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Persona } from '@/common/enums/persona.enum';
import { EmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/entities/employee-absence-category.entity';
import { SystemEmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/interfaces/system-employee-absence-categories.enum';
import { seedOrgEmployeeAbsenceCategories } from '@/employee-management/employee-absence-categories/seeds/seed-org-employee-absence-categories.seeder';
import { EmployeeAbsenceDay } from '@/employee-management/employee-absences/entities/employee-absence-days.entity';
import { EmployeeAbsence } from '@/employee-management/employee-absences/entities/employee-absence.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { SickLeaveService } from '@/employee-management/sick-leave/sick-leave.service';
import { SickLeaveNotificationService } from '@/employee-management/sick-leave/sick-leave-notification.service';
import { AbsenceCalendarSyncService } from '@/employee-management/employee-absences/absence-calendar-sync.service';
import { TimeTrackingPeriodsService } from '@/employee-management/time-tracking-periods/time-tracking-periods.service';
import { BalanceRecomputeService } from '@/employee-management/work-time-calculation/balance-recompute.service';
import { Membership } from '@/memberships/entities/membership.entity';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { Organization } from '@/organizations/entities/organization.entity';
import { User } from '@/users/entities/user.entity';
import { cleanDatabase, createTestingApp } from './test-utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeAbsence,
      EmployeeAbsenceDay,
      EmployeeAbsenceCategory,
      Employee,
      Holiday,
      Membership,
      Organization,
      User,
    ]),
  ],
  providers: [
    SickLeaveService,
    // Side effects reach out over the network (Google Calendar, SMTP). They are
    // covered by their own unit specs; here they are only observed.
    {
      provide: AbsenceCalendarSyncService,
      useValue: { sync: jest.fn().mockResolvedValue(undefined) },
    },
    {
      provide: SickLeaveNotificationService,
      useValue: { notify: jest.fn().mockResolvedValue(undefined) },
    },
    {
      provide: BalanceRecomputeService,
      useValue: { recomputeRange: jest.fn().mockResolvedValue(undefined) },
    },
    {
      provide: TimeTrackingPeriodsService,
      useValue: { assertRangeUnlocked: jest.fn().mockResolvedValue(undefined) },
    },
    {
      provide: OrganizationSettingsService,
      useValue: { getDecryptedValue: jest.fn().mockResolvedValue(null) },
    },
  ],
})
class SickLeaveTestModule {}

describe('SickLeaveService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: SickLeaveService;
  let notifications: { notify: jest.Mock };
  let calendarSync: { sync: jest.Mock };
  let recompute: { recomputeRange: jest.Mock };

  let orgRepo: Repository<Organization>;
  let userRepo: Repository<User>;
  let membershipRepo: Repository<Membership>;
  let employeeRepo: Repository<Employee>;
  let categoryRepo: Repository<EmployeeAbsenceCategory>;
  let absenceRepo: Repository<EmployeeAbsence>;
  let dayRepo: Repository<EmployeeAbsenceDay>;
  let holidayRepo: Repository<Holiday>;

  let orgId: string;
  let otherOrgId: string;
  let employeeId: string;
  let membershipId: string;
  let otherEmployeeId: string;
  let otherMembershipId: string;

  const caller = (): TokenPayload =>
    ({ orgId, membershipId, persona: Persona.EMPLOYEE }) as TokenPayload;

  const otherCaller = (): TokenPayload =>
    ({
      orgId: otherOrgId,
      membershipId: otherMembershipId,
      persona: Persona.EMPLOYEE,
    }) as TokenPayload;

  const createEmployeeInOrg = async (organizationId: string) => {
    const user = await userRepo.save(
      userRepo.create({ firstName: 'Anna', lastName: 'Muster' }),
    );
    const employee = await employeeRepo.save(employeeRepo.create({}));
    const membership = await membershipRepo.save(
      membershipRepo.create({
        organizationId,
        userId: user.id,
        employeeId: employee.id,
        persona: Persona.EMPLOYEE,
      }),
    );
    return { employee, membership };
  };

  /** Absence rows read straight from the DB, so nothing is served from memory. */
  const storedAbsences = (organizationId = orgId) =>
    absenceRepo.find({
      where: { organizationId, isActive: true },
      order: { startDate: 'ASC' },
    });

  const storedDays = (absenceId: string) =>
    dayRepo.find({
      where: { employeeAbsenceId: absenceId },
      order: { date: 'ASC' },
    });

  /**
   * ISO day of an absence day. The `date` column comes back as a Date, and the
   * stored instant is UTC midnight — reading it in the server's local zone
   * would report the previous day east of UTC.
   */
  const isoDay = (value: Date | string): string =>
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

  beforeAll(async () => {
    const app = await createTestingApp([SickLeaveTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(SickLeaveService);
    notifications = module.get(SickLeaveNotificationService);
    calendarSync = module.get(AbsenceCalendarSyncService);
    recompute = module.get(BalanceRecomputeService);

    orgRepo = dataSource.getRepository(Organization);
    userRepo = dataSource.getRepository(User);
    membershipRepo = dataSource.getRepository(Membership);
    employeeRepo = dataSource.getRepository(Employee);
    categoryRepo = dataSource.getRepository(EmployeeAbsenceCategory);
    absenceRepo = dataSource.getRepository(EmployeeAbsence);
    dayRepo = dataSource.getRepository(EmployeeAbsenceDay);
    holidayRepo = dataSource.getRepository(Holiday);
  }, 30000);

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  beforeEach(async () => {
    // The side-effect isolation tests deliberately provoke failures, which the
    // service logs with a full stack trace — silenced so a passing run is quiet.
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await cleanDatabase(dataSource);
    notifications.notify.mockClear();
    calendarSync.sync.mockClear();
    recompute.recomputeRange.mockClear();

    const org = await orgRepo.save(
      orgRepo.create({ name: 'Testschule', subdomain: `t${Date.now()}` }),
    );
    orgId = org.id;
    const other = await orgRepo.save(
      orgRepo.create({ name: 'Fremdschule', subdomain: `f${Date.now()}` }),
    );
    otherOrgId = other.id;

    await seedOrgEmployeeAbsenceCategories(dataSource.manager, orgId);
    await seedOrgEmployeeAbsenceCategories(dataSource.manager, otherOrgId);

    const own = await createEmployeeInOrg(orgId);
    employeeId = own.employee.id;
    membershipId = own.membership.id;

    const foreign = await createEmployeeInOrg(otherOrgId);
    otherEmployeeId = foreign.employee.id;
    otherMembershipId = foreign.membership.id;
  });

  describe('date persistence', () => {
    it('stores the reported day as UTC midnight in the timestamptz columns', async () => {
      // Regression: parsing the ISO day in the server's local zone wrote
      // 2026-08-19T22:00Z for a report of 2026-08-20 in CEST, so the same
      // calendar day compared unequal against the regular absence flow.
      await service.reportSickLeave({ date: '2026-08-20' }, caller());

      const [stored] = await storedAbsences();
      expect(stored.startDate.toISOString()).toBe('2026-08-20T00:00:00.000Z');
      expect(stored.endDate.toISOString()).toBe('2026-08-20T00:00:00.000Z');
    });

    it('records the absence day on the reported date', async () => {
      const result = await service.reportSickLeave(
        { date: '2026-08-20' },
        caller(),
      );

      const days = await storedDays(result.absence.id);
      expect(days).toHaveLength(1);
      // `date` is a `date` column: read back as the plain ISO day.
      expect(isoDay(days[0].date)).toBe('2026-08-20');
    });

    it('persists a mid-day start time and keeps it out of the whole-day case', async () => {
      const withTime = await service.reportSickLeave(
        { date: '2026-08-20', startTime: '13:00' },
        caller(),
      );
      const wholeDay = await service.reportSickLeave(
        { date: '2026-09-15' },
        caller(),
      );

      const one = await absenceRepo.findOneByOrFail({
        id: withTime.absence.id,
      });
      const two = await absenceRepo.findOneByOrFail({
        id: wholeDay.absence.id,
      });
      expect(one.startTime).toBe('13:00:00');
      expect(two.startTime).toBeNull();
    });
  });

  describe('merge behaviour', () => {
    it('extends the existing absence on the next day instead of creating a second one', async () => {
      const first = await service.reportSickLeave(
        { date: '2026-08-20' },
        caller(),
      );
      const second = await service.reportSickLeave(
        { date: '2026-08-21' },
        caller(),
      );

      expect(second.isExtension).toBe(true);
      expect(second.absence.id).toBe(first.absence.id);

      const absences = await storedAbsences();
      expect(absences).toHaveLength(1);
      expect(absences[0].endDate.toISOString()).toBe(
        '2026-08-21T00:00:00.000Z',
      );

      const days = await storedDays(first.absence.id);
      expect(days.map((d) => isoDay(d.date))).toEqual([
        '2026-08-20',
        '2026-08-21',
      ]);
    });

    it('bridges a weekend without creating a gap absence', async () => {
      // 2026-08-21 is a Friday, 2026-08-24 the following Monday.
      const friday = await service.reportSickLeave(
        { date: '2026-08-21' },
        caller(),
      );
      const monday = await service.reportSickLeave(
        { date: '2026-08-24' },
        caller(),
      );

      expect(monday.isExtension).toBe(true);
      expect(monday.absence.id).toBe(friday.absence.id);

      const days = await storedDays(friday.absence.id);
      // Saturday and Sunday are backfilled so the range stays contiguous.
      expect(days.map((d) => isoDay(d.date))).toEqual([
        '2026-08-21',
        '2026-08-22',
        '2026-08-23',
        '2026-08-24',
      ]);
    });

    it('bridges a working day that is an organization holiday', async () => {
      // 2026-08-20 is a Thursday, 2026-08-21 a Friday declared a holiday,
      // 2026-08-24 the Monday after the weekend.
      await holidayRepo.save(
        holidayRepo.create({
          organizationId: orgId,
          name: 'Betriebsferientag',
          date: '2026-08-21',
          paidPercentage: 100,
          repeatsYearly: false,
        }),
      );

      const first = await service.reportSickLeave(
        { date: '2026-08-20' },
        caller(),
      );
      const second = await service.reportSickLeave(
        { date: '2026-08-24' },
        caller(),
      );

      expect(second.isExtension).toBe(true);
      expect(second.absence.id).toBe(first.absence.id);
      expect(await storedAbsences()).toHaveLength(1);
    });

    it('creates a separate absence when a working day lies in between', async () => {
      // 2026-08-20 Thursday, 2026-08-24 Monday — the Friday in between is a
      // regular working day, so the employee was back at work.
      const first = await service.reportSickLeave(
        { date: '2026-08-20' },
        caller(),
      );
      const second = await service.reportSickLeave(
        { date: '2026-08-24' },
        caller(),
      );

      expect(second.isExtension).toBe(false);
      expect(second.absence.id).not.toBe(first.absence.id);
      expect(await storedAbsences()).toHaveLength(2);
    });

    it('changes nothing when the day is already covered', async () => {
      const first = await service.reportSickLeave(
        { date: '2026-08-20' },
        caller(),
      );
      notifications.notify.mockClear();
      calendarSync.sync.mockClear();
      recompute.recomputeRange.mockClear();

      const repeat = await service.reportSickLeave(
        { date: '2026-08-20' },
        caller(),
      );

      expect(repeat.isUnchanged).toBe(true);
      expect(repeat.absence.id).toBe(first.absence.id);
      expect(await storedAbsences()).toHaveLength(1);
      // No second round of mails for a duplicate tap.
      expect(notifications.notify).not.toHaveBeenCalled();
      expect(calendarSync.sync).not.toHaveBeenCalled();
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
    });

    it('does not merge into a non-mergeable category', async () => {
      // A training absence must never silently become sick leave.
      const training = await categoryRepo.findOneByOrFail({
        organizationId: orgId,
        systemCode: SystemEmployeeAbsenceCategory.TRAINING,
      });
      const organization = await orgRepo.findOneByOrFail({ id: orgId });
      const membership = await membershipRepo.findOneByOrFail({
        id: membershipId,
      });
      await absenceRepo.save(
        absenceRepo.create({
          organization,
          organizationId: orgId,
          membership,
          membershipId,
          employeeId,
          absenceCategory: training,
          absenceCategoryId: training.id,
          startDate: new Date(Date.UTC(2026, 7, 20)),
          endDate: new Date(Date.UTC(2026, 7, 20)),
          isTeamInformed: true,
          certificates: [],
          additionalDocuments: [],
        }),
      );

      const result = await service.reportSickLeave(
        { date: '2026-08-21' },
        caller(),
      );

      expect(result.isExtension).toBe(false);
      expect(await storedAbsences()).toHaveLength(2);
    });
  });

  describe('multi-tenant isolation', () => {
    it('never merges into an absence of another organization', async () => {
      await service.reportSickLeave({ date: '2026-08-20' }, otherCaller());

      const result = await service.reportSickLeave(
        { date: '2026-08-21' },
        caller(),
      );

      expect(result.isExtension).toBe(false);
      expect(result.absence.organizationId).toBe(orgId);
      expect(await storedAbsences(orgId)).toHaveLength(1);
      expect(await storedAbsences(otherOrgId)).toHaveLength(1);
    });

    it('writes the absence into the token organization, for the token employee', async () => {
      const result = await service.reportSickLeave(
        { date: '2026-08-20' },
        caller(),
      );

      const stored = await absenceRepo.findOneByOrFail({
        id: result.absence.id,
      });
      expect(stored.organizationId).toBe(orgId);
      expect(stored.employeeId).toBe(employeeId);
      expect(stored.employeeId).not.toBe(otherEmployeeId);
    });

    it('rejects a token whose membership belongs to another organization', async () => {
      // Membership id of the foreign org, organization id of this one — the
      // lookup is scoped on both, so no absence may be created.
      await expect(
        service.reportSickLeave({ date: '2026-08-20' }, {
          orgId,
          membershipId: otherMembershipId,
          persona: Persona.EMPLOYEE,
        } as TokenPayload),
      ).rejects.toThrow(/Membership not found/);

      expect(await storedAbsences(orgId)).toHaveLength(0);
    });

    it('uses only the sickness category of the caller organization', async () => {
      const result = await service.reportSickLeave(
        { date: '2026-08-20' },
        caller(),
      );

      const category = await categoryRepo.findOneByOrFail({
        id: result.absence.absenceCategoryId,
      });
      expect(category.organizationId).toBe(orgId);
      expect(category.systemCode).toBe(SystemEmployeeAbsenceCategory.SICKNESS);
    });
  });

  describe('side effects', () => {
    it('recomputes the balances over the persisted range', async () => {
      await service.reportSickLeave({ date: '2026-08-20' }, caller());
      recompute.recomputeRange.mockClear();

      await service.reportSickLeave({ date: '2026-08-21' }, caller());

      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        orgId,
        employeeId,
        '2026-08-20',
        '2026-08-21',
      );
    });

    it('notifies with the stored dates and marks the extension', async () => {
      await service.reportSickLeave({ date: '2026-08-20' }, caller());
      notifications.notify.mockClear();

      await service.reportSickLeave(
        { date: '2026-08-21', comment: 'immer noch krank' },
        caller(),
      );

      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgId,
          employeeId,
          isExtension: true,
          comment: 'immer noch krank',
        }),
      );
      const call = notifications.notify.mock.calls[0][0] as {
        startDate: Date;
        endDate: Date;
      };
      expect(call.startDate.toISOString()).toBe('2026-08-20T00:00:00.000Z');
      expect(call.endDate.toISOString()).toBe('2026-08-21T00:00:00.000Z');
    });

    it('keeps the absence when the calendar sync fails', async () => {
      calendarSync.sync.mockRejectedValueOnce(new Error('Google down'));

      await expect(
        service.reportSickLeave({ date: '2026-08-20' }, caller()),
      ).resolves.toEqual(expect.objectContaining({ isUnchanged: false }));

      expect(await storedAbsences()).toHaveLength(1);
      // The mails still go out — the failures are isolated from each other.
      expect(notifications.notify).toHaveBeenCalled();
    });

    it('keeps the absence when the notification fails', async () => {
      notifications.notify.mockRejectedValueOnce(new Error('SMTP down'));

      await expect(
        service.reportSickLeave({ date: '2026-08-20' }, caller()),
      ).resolves.toEqual(expect.objectContaining({ isUnchanged: false }));

      expect(await storedAbsences()).toHaveLength(1);
    });
  });

  describe('comments', () => {
    it('appends every follow-up comment with its date prefix', async () => {
      await service.reportSickLeave(
        { date: '2026-08-20', comment: 'Fieber' },
        caller(),
      );
      const extended = await service.reportSickLeave(
        { date: '2026-08-21', comment: 'immer noch' },
        caller(),
      );

      const stored = await absenceRepo.findOneByOrFail({
        id: extended.absence.id,
      });
      expect(stored.note).toContain('20.08.2026: Fieber');
      expect(stored.note).toContain('21.08.2026: immer noch');
    });
  });
});
