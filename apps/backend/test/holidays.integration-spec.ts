/**
 * Integration tests for HolidaysService against a real PostgreSQL database.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=holidays
 */
import { DataSource, Repository } from 'typeorm';
import { Module, NotFoundException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { HolidaysService } from '@/employee-management/holidays/holidays.service';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { BalanceRecomputeService } from '@/employee-management/work-time-calculation/balance-recompute.service';
import { CompanyVacationsService } from '@/employee-management/company-vacations/company-vacations.service';
import { TimeTrackingPeriodsService } from '@/employee-management/time-tracking-periods/time-tracking-periods.service';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [TypeOrmModule.forFeature([Holiday, Organization])],
  providers: [
    HolidaysService,
    {
      provide: BalanceRecomputeService,
      useValue: { recomputeOrgRange: jest.fn().mockResolvedValue(undefined) },
    },
    {
      provide: CompanyVacationsService,
      useValue: {
        recomputeEffectiveDaysForOrg: jest.fn().mockResolvedValue(undefined),
      },
    },
    {
      provide: TimeTrackingPeriodsService,
      useValue: {
        getAnchor: jest.fn().mockResolvedValue({ month: 1, day: 1 }),
      },
    },
  ],
})
class HolidaysTestModule {}

describe('HolidaysService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: HolidaysService;
  let recompute: { recomputeOrgRange: jest.Mock };

  let orgRepo: Repository<Organization>;
  let holidayRepo: Repository<Holiday>;

  let orgId: string;
  let otherOrgId: string;

  beforeAll(async () => {
    const app = await createTestingApp([HolidaysTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(HolidaysService);
    recompute = module.get(BalanceRecomputeService);

    orgRepo = dataSource.getRepository(Organization);
    holidayRepo = dataSource.getRepository(Holiday);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    recompute.recomputeOrgRange.mockClear();

    const org = await orgRepo.save(
      orgRepo.create({ name: 'Testschule', subdomain: `t${Date.now()}` }),
    );
    orgId = org.id;
    const other = await orgRepo.save(
      orgRepo.create({ name: 'Fremdschule', subdomain: `f${Date.now()}` }),
    );
    otherOrgId = other.id;
  });

  describe('create', () => {
    it('persists defaults and triggers recompute for a one-off holiday', async () => {
      const created = await service.create(
        { date: '2026-08-01', name: 'Nationalfeiertag' },
        orgId,
      );

      expect(created.organizationId).toBe(orgId);
      expect(created.paidPercentage).toBe(100);
      expect(created.repeatsYearly).toBe(false);
      expect(created.isActive).toBe(true);
      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        orgId,
        '2026-08-01',
        '2026-08-01',
      );
    });

    it('persists a yearly holiday', async () => {
      const created = await service.create(
        {
          date: '2020-08-01',
          name: 'Nationalfeiertag',
          repeatsYearly: true,
          paidPercentage: 100,
        },
        orgId,
      );

      expect(created.repeatsYearly).toBe(true);
      const stored = await holidayRepo.findOneByOrFail({ id: created.id });
      expect(stored.repeatsYearly).toBe(true);
    });

    it('rejects duplicate dates within the same org', async () => {
      await service.create({ date: '2026-08-01', name: 'A' }, orgId);

      await expect(
        service.create({ date: '2026-08-01', name: 'B' }, orgId),
      ).rejects.toThrow();
    });

    it('allows the same date in another org', async () => {
      await service.create({ date: '2026-08-01', name: 'A' }, orgId);
      const other = await service.create(
        { date: '2026-08-01', name: 'B' },
        otherOrgId,
      );
      expect(other.organizationId).toBe(otherOrgId);
    });
  });

  describe('findAll', () => {
    it('returns only active holidays from the requested org', async () => {
      await service.create({ date: '2026-01-01', name: 'Org A' }, orgId);
      await service.create({ date: '2026-01-01', name: 'Org B' }, otherOrgId);
      const softDeleted = await service.create(
        { date: '2026-02-01', name: 'Gone' },
        orgId,
      );
      await service.remove(softDeleted.id, orgId);

      const list = await service.findAll(orgId);
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Org A');
    });
  });

  describe('update / remove (multi-tenant isolation)', () => {
    it('throws when updating a foreign-org holiday', async () => {
      const foreign = await service.create(
        { date: '2026-03-01', name: 'Fremd' },
        otherOrgId,
      );

      await expect(
        service.update({ id: foreign.id, name: 'Hacked' }, orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when deleting a foreign-org holiday', async () => {
      const foreign = await service.create(
        { date: '2026-04-01', name: 'Fremd' },
        otherOrgId,
      );

      await expect(service.remove(foreign.id, orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('updates name and soft-deletes within the own org', async () => {
      const created = await service.create(
        { date: '2026-05-01', name: 'Alt' },
        orgId,
      );

      const updated = await service.update(
        { id: created.id, name: 'Neu', paidPercentage: 50 },
        orgId,
      );
      expect(updated.name).toBe('Neu');
      expect(updated.paidPercentage).toBe(50);

      await service.remove(created.id, orgId);
      expect(await service.findAll(orgId)).toHaveLength(0);

      const stored = await holidayRepo.findOneByOrFail({ id: created.id });
      expect(stored.isActive).toBe(false);
    });
  });
});
