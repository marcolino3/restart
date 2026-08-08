/**
 * Integration tests for EmployeeVacationsService against a real PostgreSQL database.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=employee-vacations
 */
import { DataSource, Repository } from 'typeorm';
import { Module, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { EmployeeVacationsService } from '@/employee-management/employee-vacations/employee-vacations.service';
import { EmployeeVacation } from '@/employee-management/employee-vacations/entities/employee-vacation.entity';
import { EmployeeVacationAccrualType } from '@/employee-management/employee-vacations/entities/employee-vacation-accrual-type.enum';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { User } from '@/users/entities/user.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Persona } from '@/common/enums/persona.enum';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { BalanceRecomputeService } from '@/employee-management/work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '@/employee-management/work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '@/employee-management/time-tracking-periods/time-tracking-periods.service';
import { CreateEmployeeVacationInput } from '@/employee-management/employee-vacations/dto/create-employee-vacation.input';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeVacation,
      Holiday,
      Employee,
      Membership,
      Organization,
      User,
    ]),
  ],
  providers: [
    EmployeeVacationsService,
    {
      provide: BalanceRecomputeService,
      useValue: { recomputeRange: jest.fn().mockResolvedValue(undefined) },
    },
    {
      provide: TimeTrackingAccessService,
      useValue: {
        assertCanViewEmployee: jest.fn().mockResolvedValue(undefined),
        assertCanManageEmployee: jest.fn().mockResolvedValue(undefined),
      },
    },
    {
      provide: TimeTrackingPeriodsService,
      useValue: {
        assertRangeUnlocked: jest.fn().mockResolvedValue(undefined),
        getAnchor: jest.fn().mockResolvedValue({ month: 1, day: 1 }),
      },
    },
  ],
})
class EmployeeVacationsTestModule {}

describe('EmployeeVacationsService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: EmployeeVacationsService;
  let recompute: { recomputeRange: jest.Mock };
  let access: {
    assertCanViewEmployee: jest.Mock;
    assertCanManageEmployee: jest.Mock;
  };

  let orgRepo: Repository<Organization>;
  let userRepo: Repository<User>;
  let membershipRepo: Repository<Membership>;
  let employeeRepo: Repository<Employee>;
  let vacationRepo: Repository<EmployeeVacation>;

  let orgId: string;
  let otherOrgId: string;
  let employeeId: string;

  const adminUser = (): TokenPayload =>
    ({
      orgId,
      persona: Persona.ADMIN,
    }) as TokenPayload;

  const createInput = (
    over: Partial<CreateEmployeeVacationInput> & { employeeId: string },
  ): CreateEmployeeVacationInput => ({
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    ...over,
  });

  const createEmployeeInOrg = async (organizationId: string) => {
    const user = await userRepo.save(
      userRepo.create({ firstName: 'Max', lastName: 'Muster' }),
    );
    const employee = await employeeRepo.save(employeeRepo.create({}));
    await membershipRepo.save(
      membershipRepo.create({
        organizationId,
        userId: user.id,
        employeeId: employee.id,
        persona: Persona.EMPLOYEE,
      }),
    );
    return employee;
  };

  beforeAll(async () => {
    const app = await createTestingApp([EmployeeVacationsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(EmployeeVacationsService);
    recompute = module.get(BalanceRecomputeService);
    access = module.get(TimeTrackingAccessService);

    orgRepo = dataSource.getRepository(Organization);
    userRepo = dataSource.getRepository(User);
    membershipRepo = dataSource.getRepository(Membership);
    employeeRepo = dataSource.getRepository(Employee);
    vacationRepo = dataSource.getRepository(EmployeeVacation);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    recompute.recomputeRange.mockClear();
    access.assertCanViewEmployee.mockClear();
    access.assertCanManageEmployee.mockClear();

    const org = await orgRepo.save(
      orgRepo.create({ name: 'Testschule', subdomain: `t${Date.now()}` }),
    );
    orgId = org.id;
    const other = await orgRepo.save(
      orgRepo.create({ name: 'Fremdschule', subdomain: `f${Date.now()}` }),
    );
    otherOrgId = other.id;

    const employee = await createEmployeeInOrg(orgId);
    employeeId = employee.id;
  });

  describe('create', () => {
    it('persists defaults, resolves membershipId and triggers recompute', async () => {
      const created = await service.create(
        createInput({
          employeeId,
          startDate: '2026-07-01',
          endDate: '2026-07-10',
        }),
        adminUser(),
      );

      expect(created.organizationId).toBe(orgId);
      expect(created.employeeId).toBe(employeeId);
      expect(created.membershipId).toBeTruthy();
      expect(created.accrualType).toBe(EmployeeVacationAccrualType.CHARGED);
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        orgId,
        employeeId,
        '2026-07-01',
        '2026-07-10',
      );
    });

    it('throws when the employee has no membership in the org', async () => {
      const orphan = await employeeRepo.save(employeeRepo.create({}));

      await expect(
        service.create(createInput({ employeeId: orphan.id }), adminUser()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findByEmployee', () => {
    it('returns only active vacations for the employee, checking view access', async () => {
      const created = await service.create(
        createInput({
          employeeId,
          startDate: '2026-07-01',
          endDate: '2026-07-05',
        }),
        adminUser(),
      );
      const softDeleted = await service.create(
        createInput({
          employeeId,
          startDate: '2026-08-01',
          endDate: '2026-08-05',
        }),
        adminUser(),
      );
      await service.remove(softDeleted.id, adminUser());

      const list = await service.findByEmployee(adminUser(), employeeId);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(created.id);
      expect(access.assertCanViewEmployee).toHaveBeenCalledWith(
        adminUser(),
        employeeId,
      );
    });

    it('does not leak vacations from a foreign organization', async () => {
      const foreignEmployee = await createEmployeeInOrg(otherOrgId);
      await service.create(
        createInput({
          employeeId: foreignEmployee.id,
          startDate: '2026-07-01',
          endDate: '2026-07-05',
        }),
        { orgId: otherOrgId, persona: Persona.ADMIN } as TokenPayload,
      );

      const list = await service.findByEmployee(adminUser(), employeeId);
      expect(list).toHaveLength(0);
    });
  });

  describe('update / remove (multi-tenant isolation)', () => {
    it('throws NotFoundException when updating a foreign-org vacation', async () => {
      const foreignEmployee = await createEmployeeInOrg(otherOrgId);
      const foreign = await service.create(
        createInput({
          employeeId: foreignEmployee.id,
          startDate: '2026-09-01',
          endDate: '2026-09-05',
        }),
        { orgId: otherOrgId, persona: Persona.ADMIN } as TokenPayload,
      );

      await expect(
        service.update(
          { id: foreign.id, employeeId: foreignEmployee.id, name: 'Hacked' },
          adminUser(),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when deleting a foreign-org vacation', async () => {
      const foreignEmployee = await createEmployeeInOrg(otherOrgId);
      const foreign = await service.create(
        createInput({
          employeeId: foreignEmployee.id,
          startDate: '2026-10-01',
          endDate: '2026-10-05',
        }),
        { orgId: otherOrgId, persona: Persona.ADMIN } as TokenPayload,
      );

      await expect(
        service.remove(foreign.id, adminUser()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the range and soft-deletes within the own org, recomputing the widened range', async () => {
      const created = await service.create(
        createInput({
          employeeId,
          startDate: '2026-07-01',
          endDate: '2026-07-10',
        }),
        adminUser(),
      );

      const updated = await service.update(
        {
          id: created.id,
          employeeId,
          startDate: '2026-06-25',
          endDate: '2026-07-20',
          name: 'Sommerferien',
        },
        adminUser(),
      );
      expect(updated.name).toBe('Sommerferien');
      expect(updated.startDate).toBe('2026-06-25');
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        orgId,
        employeeId,
        '2026-06-25',
        '2026-07-20',
      );

      await service.remove(created.id, adminUser());
      const list = await service.findByEmployee(adminUser(), employeeId);
      expect(list).toHaveLength(0);

      const stored = await vacationRepo.findOneByOrFail({ id: created.id });
      expect(stored.isActive).toBe(false);
    });

    it('propagates ForbiddenException from access checks on manage', async () => {
      access.assertCanManageEmployee.mockRejectedValueOnce(
        new ForbiddenException('Kein Schreibzugriff auf diesen Mitarbeiter.'),
      );

      await expect(
        service.create(createInput({ employeeId }), adminUser()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
