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
import { NotFoundException } from '@nestjs/common';
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
      provide: BalanceRecomputeService,
      useValue: { recomputeRange: jest.fn().mockResolvedValue(undefined) },
    },
    {
      provide: TimeTrackingAccessService,
      useValue: {
        assertCanViewEmployee: jest.fn().mockResolvedValue(undefined),
        assertCanManageEmployee: jest.fn().mockResolvedValue(undefined),
        assertCanManageAbsence: jest.fn().mockResolvedValue(undefined),
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
});
