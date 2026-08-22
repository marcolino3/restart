/**
 * Integration tests for EmployeeAbsencesService against a real PostgreSQL database.
 *
 * Covers JSONB document persistence, soft-delete, and multi-tenant isolation.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=employee-absences
 */
import { DataSource, Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { EmployeeAbsencesService } from '@/employee-management/employee-absences/employee-absences.service';
import { EmployeeAbsence } from '@/employee-management/employee-absences/entities/employee-absence.entity';
import { EmployeeAbsenceDay } from '@/employee-management/employee-absences/entities/employee-absence-days.entity';
import { EmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/entities/employee-absence-category.entity';
import { seedOrgEmployeeAbsenceCategories } from '@/employee-management/employee-absence-categories/seeds/seed-org-employee-absence-categories.seeder';
import { SystemEmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/interfaces/system-employee-absence-categories.enum';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { User } from '@/users/entities/user.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Persona } from '@/common/enums/persona.enum';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { AbsenceCalendarSyncService } from '@/employee-management/employee-absences/absence-calendar-sync.service';
import { AbsenceRequestNotificationService } from '@/employee-management/employee-absences/absence-request-notification.service';
import { EmployeeAbsenceStatus } from '@/employee-management/employee-absences/entities/employee-absence-status.enum';
import { CreateEmployeeAbsenceNoticeInput } from '@/employee-management/employee-absences/dto/create-employee-absence-notice.input';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { StorageService } from '@/storage/storage.service';
import { BalanceRecomputeService } from '@/employee-management/work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '@/employee-management/work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '@/employee-management/time-tracking-periods/time-tracking-periods.service';
import { CreateEmployeeAbsenceInput } from '@/employee-management/employee-absences/dto/create-employee-absence.input';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeAbsence,
      EmployeeAbsenceDay,
      EmployeeAbsenceCategory,
      Employee,
      Membership,
      Organization,
      User,
    ]),
  ],
  providers: [
    EmployeeAbsencesService,
    // The calendar mirror is a network side effect with its own unit spec;
    // here it only has to exist so the service can be constructed.
    {
      provide: AbsenceCalendarSyncService,
      useValue: {
        sync: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      },
    },
    {
      provide: AbsenceRequestNotificationService,
      useValue: {
        notifyRequested: jest.fn().mockResolvedValue(undefined),
        notifyDecided: jest.fn().mockResolvedValue(undefined),
      },
    },
    {
      provide: BalanceRecomputeService,
      useValue: { recomputeRange: jest.fn().mockResolvedValue(undefined) },
    },
    {
      provide: TimeTrackingAccessService,
      useValue: {
        assertCanViewEmployee: jest.fn().mockResolvedValue(undefined),
        assertCanManageEmployee: jest.fn().mockResolvedValue(undefined),
        assertCanManageAbsence: jest.fn().mockResolvedValue(undefined),
        resolveOverviewScope: jest.fn().mockResolvedValue(null),
      },
    },
    {
      provide: TimeTrackingPeriodsService,
      useValue: { assertRangeUnlocked: jest.fn().mockResolvedValue(undefined) },
    },
    {
      provide: StorageService,
      useValue: { delete: jest.fn().mockResolvedValue(undefined) },
    },
  ],
})
class EmployeeAbsencesTestModule {}

describe('EmployeeAbsencesService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: EmployeeAbsencesService;
  let recompute: { recomputeRange: jest.Mock };
  let access: {
    assertCanManageAbsence: jest.Mock;
    resolveOverviewScope: jest.Mock;
  };
  let notifications: { notifyRequested: jest.Mock; notifyDecided: jest.Mock };

  let orgRepo: Repository<Organization>;
  let userRepo: Repository<User>;
  let membershipRepo: Repository<Membership>;
  let employeeRepo: Repository<Employee>;
  let categoryRepo: Repository<EmployeeAbsenceCategory>;
  let absenceRepo: Repository<EmployeeAbsence>;

  let orgId: string;
  let otherOrgId: string;
  let employeeId: string;
  let membershipId: string;
  let categoryId: string;
  let otherCategoryId: string;

  const adminUser = (): TokenPayload =>
    ({
      orgId,
      membershipId,
      persona: Persona.ADMIN,
    }) as TokenPayload;

  const createInput = (
    over: Partial<CreateEmployeeAbsenceInput> & {
      employeeId: string;
      absenceCategoryId: string;
    },
  ): CreateEmployeeAbsenceInput => ({
    startDate: '2026-04-01',
    endDate: '2026-04-02',
    note: '',
    isTeamInformed: true,
    ...over,
  });

  const createEmployeeInOrg = async (organizationId: string) => {
    const user = await userRepo.save(
      userRepo.create({ firstName: 'Max', lastName: 'Muster' }),
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

  beforeAll(async () => {
    const app = await createTestingApp([EmployeeAbsencesTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(EmployeeAbsencesService);
    recompute = module.get(BalanceRecomputeService);
    access = module.get(TimeTrackingAccessService);
    notifications = module.get(AbsenceRequestNotificationService);

    orgRepo = dataSource.getRepository(Organization);
    userRepo = dataSource.getRepository(User);
    membershipRepo = dataSource.getRepository(Membership);
    employeeRepo = dataSource.getRepository(Employee);
    categoryRepo = dataSource.getRepository(EmployeeAbsenceCategory);
    absenceRepo = dataSource.getRepository(EmployeeAbsence);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    recompute.recomputeRange.mockClear();
    access.assertCanManageAbsence.mockReset().mockResolvedValue(undefined);
    access.resolveOverviewScope.mockReset().mockResolvedValue(null);
    notifications.notifyRequested.mockClear();
    notifications.notifyDecided.mockClear();

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

    const sickness = await categoryRepo.findOneByOrFail({
      organizationId: orgId,
      systemCode: SystemEmployeeAbsenceCategory.SICKNESS,
    });
    categoryId = sickness.id;

    const otherSickness = await categoryRepo.findOneByOrFail({
      organizationId: otherOrgId,
      systemCode: SystemEmployeeAbsenceCategory.SICKNESS,
    });
    otherCategoryId = otherSickness.id;

    const { employee, membership } = await createEmployeeInOrg(orgId);
    employeeId = employee.id;
    membershipId = membership.id;
  });

  describe('createEmployeeAbsence', () => {
    it('persists labeled certificates and additional documents', async () => {
      const created = await service.createEmployeeAbsence(
        createInput({
          employeeId,
          absenceCategoryId: categoryId,
          startDate: '2026-04-01',
          endDate: '2026-04-03',
          note: 'Grippe',
          certificates: [
            { url: '/api/absence-certificates/a.pdf', label: 'Erstattung' },
          ],
          additionalDocuments: [
            { url: '/api/absence-certificates/b.pdf', label: 'Unfallmeldung' },
          ],
        }),
        adminUser(),
      );

      expect(created.organizationId).toBe(orgId);
      expect(created.certificates).toEqual([
        { url: '/api/absence-certificates/a.pdf', label: 'Erstattung' },
      ]);
      expect(created.additionalDocuments).toEqual([
        { url: '/api/absence-certificates/b.pdf', label: 'Unfallmeldung' },
      ]);

      const stored = await absenceRepo.findOneByOrFail({ id: created.id });
      expect(stored.certificates).toEqual(created.certificates);
      expect(stored.additionalDocuments).toEqual(created.additionalDocuments);
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        orgId,
        employeeId,
        '2026-04-01',
        '2026-04-03',
      );
    });

    it('rejects categories from a foreign organization', async () => {
      await expect(
        service.createEmployeeAbsence(
          createInput({
            employeeId,
            absenceCategoryId: otherCategoryId,
            startDate: '2026-04-01',
            endDate: '2026-04-02',
          }),
          adminUser(),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAllByEmployeeId', () => {
    it('returns only active absences for the employee in the org', async () => {
      const created = await service.createEmployeeAbsence(
        createInput({
          employeeId,
          absenceCategoryId: categoryId,
          startDate: '2026-05-01',
          endDate: '2026-05-02',
        }),
        adminUser(),
      );
      await service.deleteEmployeeAbsence(created.id, adminUser());

      const list = await service.findAllByEmployeeId(employeeId, adminUser());
      expect(list).toHaveLength(0);
    });
  });

  describe('updateEmployeeAbsence', () => {
    it('updates document arrays and note', async () => {
      const created = await service.createEmployeeAbsence(
        createInput({
          employeeId,
          absenceCategoryId: categoryId,
          startDate: '2026-06-01',
          endDate: '2026-06-02',
          note: 'alt',
        }),
        adminUser(),
      );

      const updated = await service.updateEmployeeAbsence(
        {
          id: created.id,
          note: 'neu',
          certificates: [
            { url: '/api/absence-certificates/c.pdf', label: 'Folgezeugnis' },
          ],
        },
        adminUser(),
      );

      expect(updated.note).toBe('neu');
      expect(updated.certificates).toEqual([
        { url: '/api/absence-certificates/c.pdf', label: 'Folgezeugnis' },
      ]);
    });

    it('throws when updating a foreign-org absence', async () => {
      const { employee: foreignEmployee } =
        await createEmployeeInOrg(otherOrgId);
      const foreign = await service.createEmployeeAbsence(
        createInput({
          employeeId: foreignEmployee.id,
          absenceCategoryId: otherCategoryId,
          startDate: '2026-06-10',
          endDate: '2026-06-11',
        }),
        { orgId: otherOrgId, membershipId: 'foreign-mem' } as TokenPayload,
      );

      await expect(
        service.updateEmployeeAbsence(
          { id: foreign.id, note: 'hack' },
          adminUser(),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteEmployeeAbsence', () => {
    it('soft-deletes within the own org', async () => {
      const created = await service.createEmployeeAbsence(
        createInput({
          employeeId,
          absenceCategoryId: categoryId,
          startDate: '2026-07-01',
          endDate: '2026-07-02',
        }),
        adminUser(),
      );

      await expect(
        service.deleteEmployeeAbsence(created.id, adminUser()),
      ).resolves.toBe(true);

      const stored = await absenceRepo.findOneByOrFail({ id: created.id });
      expect(stored.isActive).toBe(false);
    });

    it('throws when deleting a foreign-org absence', async () => {
      const { employee: foreignEmployee } =
        await createEmployeeInOrg(otherOrgId);
      const foreign = await service.createEmployeeAbsence(
        createInput({
          employeeId: foreignEmployee.id,
          absenceCategoryId: otherCategoryId,
          startDate: '2026-07-10',
          endDate: '2026-07-11',
        }),
        { orgId: otherOrgId, membershipId: 'foreign-mem' } as TokenPayload,
      );

      await expect(
        service.deleteEmployeeAbsence(foreign.id, adminUser()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('approval workflow', () => {
    const dayRepo = () => dataSource.getRepository(EmployeeAbsenceDay);
    const isoPlus = (days: number) =>
      new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

    /** Category that must be requested (TRAINING is seeded with requiresApproval=true). */
    const requestCategoryId = async (organizationId = orgId) =>
      (
        await categoryRepo.findOneByOrFail({
          organizationId,
          systemCode: SystemEmployeeAbsenceCategory.TRAINING,
        })
      ).id;

    const employeeUser = (): TokenPayload =>
      ({ orgId, membershipId, persona: Persona.EMPLOYEE }) as TokenPayload;

    const requestAbsence = async (user = employeeUser(), startOffset = 30) =>
      service.createEmployeeAbsenceNotice(
        {
          absenceCategoryId: await requestCategoryId(user.orgId),
          startDate: isoPlus(startOffset),
          endDate: isoPlus(startOffset + 1),
        } as CreateEmployeeAbsenceNoticeInput,
        user,
      );

    it('stores a request as PENDING without absence days or recompute', async () => {
      const created = await requestAbsence();
      expect(created.status).toBe(EmployeeAbsenceStatus.PENDING);
      expect(created.requestedAt).toBeTruthy();
      expect(await dayRepo().countBy({ employeeAbsenceId: created.id })).toBe(
        0,
      );
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
      expect(notifications.notifyRequested).toHaveBeenCalledTimes(1);
    });

    it('rejects a notice category beyond tomorrow', async () => {
      await expect(
        service.createEmployeeAbsenceNotice(
          {
            absenceCategoryId: categoryId,
            startDate: isoPlus(3),
          } as CreateEmployeeAbsenceNoticeInput,
          employeeUser(),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('approve by admin writes days, recomputes and notifies', async () => {
      const created = await requestAbsence();
      const { membership: adminMembership } = await createEmployeeInOrg(orgId);
      const admin = {
        orgId,
        membershipId: adminMembership.id,
        roles: [SystemRole.ORG_ADMIN],
      } as TokenPayload;

      const approved = await service.approveEmployeeAbsence(
        created.id,
        null,
        admin,
      );
      expect(approved.status).toBe(EmployeeAbsenceStatus.APPROVED);
      expect(approved.decidedByMembershipId).toBe(adminMembership.id);
      expect(await dayRepo().countBy({ employeeAbsenceId: created.id })).toBe(
        2,
      );
      expect(recompute.recomputeRange).toHaveBeenCalledTimes(1);
      expect(notifications.notifyDecided).toHaveBeenCalledWith(
        expect.objectContaining({ approved: true }),
      );
    });

    it('reject requires a note and never writes days', async () => {
      const created = await requestAbsence();
      const { membership: hr } = await createEmployeeInOrg(orgId);
      const hrUser = {
        orgId,
        membershipId: hr.id,
        roles: [SystemRole.HR_MANAGER],
      } as TokenPayload;

      await expect(
        service.rejectEmployeeAbsence(created.id, '', hrUser),
      ).rejects.toBeInstanceOf(BadRequestException);

      const rejected = await service.rejectEmployeeAbsence(
        created.id,
        'Zu wenig Personal',
        hrUser,
      );
      expect(rejected.status).toBe(EmployeeAbsenceStatus.REJECTED);
      expect(rejected.decisionNote).toBe('Zu wenig Personal');
      expect(await dayRepo().countBy({ employeeAbsenceId: created.id })).toBe(
        0,
      );
      expect(recompute.recomputeRange).not.toHaveBeenCalled();

      // A rejected request no longer blocks the same range.
      await expect(requestAbsence()).resolves.toMatchObject({
        status: EmployeeAbsenceStatus.PENDING,
      });
    });

    it('a pending request blocks an overlapping request', async () => {
      await requestAbsence();
      await expect(requestAbsence()).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('a lead cannot decide their own request', async () => {
      const created = await requestAbsence();
      await expect(
        service.approveEmployeeAbsence(created.id, null, {
          ...employeeUser(),
          roles: [SystemRole.TEAM_LEAD],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('a lead outside the employee scope gets 403', async () => {
      const created = await requestAbsence();
      const { membership: lead } = await createEmployeeInOrg(orgId);
      access.assertCanManageAbsence.mockRejectedValueOnce(
        new ForbiddenException('scope'),
      );
      await expect(
        service.approveEmployeeAbsence(created.id, null, {
          orgId,
          membershipId: lead.id,
          roles: [SystemRole.TEAM_LEAD],
        } as TokenPayload),
      ).rejects.toBeInstanceOf(ForbiddenException);
      const stored = await absenceRepo.findOneByOrFail({ id: created.id });
      expect(stored.status).toBe(EmployeeAbsenceStatus.PENDING);
    });

    it('a foreign-org admin cannot see or decide the request', async () => {
      const created = await requestAbsence();
      const { membership: foreignAdmin } =
        await createEmployeeInOrg(otherOrgId);
      const foreign = {
        orgId: otherOrgId,
        membershipId: foreignAdmin.id,
        roles: [SystemRole.ORG_ADMIN],
      } as TokenPayload;

      await expect(
        service.approveEmployeeAbsence(created.id, null, foreign),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.rejectEmployeeAbsence(created.id, 'nope', foreign),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(await service.findPendingRequests(foreign)).toHaveLength(0);
    });

    it('findPendingRequests honours the lead scope', async () => {
      const created = await requestAbsence();
      const { employee: otherEmployee, membership: otherMembership } =
        await createEmployeeInOrg(orgId);
      await requestAbsence(
        { orgId, membershipId: otherMembership.id } as TokenPayload,
        60,
      );

      expect(await service.findPendingRequests(adminUser())).toHaveLength(2);

      access.resolveOverviewScope.mockResolvedValueOnce([otherEmployee.id]);
      const scoped = await service.findPendingRequests(adminUser());
      expect(scoped.map((a) => a.employeeId)).toEqual([otherEmployee.id]);

      access.resolveOverviewScope.mockResolvedValueOnce([]);
      expect(await service.findPendingRequests(adminUser())).toHaveLength(0);
      expect(scoped.find((a) => a.id === created.id)).toBeUndefined();
    });

    it('withdraw only works for the own pending request', async () => {
      const created = await requestAbsence();
      const { membership: stranger } = await createEmployeeInOrg(orgId);
      await expect(
        service.withdrawMyAbsenceRequest(created.id, {
          orgId,
          membershipId: stranger.id,
        } as TokenPayload),
      ).rejects.toBeInstanceOf(NotFoundException);

      await expect(
        service.withdrawMyAbsenceRequest(created.id, employeeUser()),
      ).resolves.toBe(true);
      const stored = await absenceRepo.findOneByOrFail({ id: created.id });
      expect(stored.isActive).toBe(false);
    });
  });
});
