/**
 * Integration tests for CompanyVacationsService against a real PostgreSQL database.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=company-vacations
 */
import { DataSource, Repository } from 'typeorm';
import { Module, NotFoundException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { CompanyVacationsService } from '@/employee-management/company-vacations/company-vacations.service';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { BalanceRecomputeService } from '@/employee-management/work-time-calculation/balance-recompute.service';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyVacation, Organization])],
  providers: [
    CompanyVacationsService,
    {
      provide: BalanceRecomputeService,
      useValue: { recomputeOrgRange: jest.fn().mockResolvedValue(undefined) },
    },
  ],
})
class CompanyVacationsTestModule {}

describe('CompanyVacationsService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: CompanyVacationsService;
  let recompute: { recomputeOrgRange: jest.Mock };

  let orgRepo: Repository<Organization>;
  let vacationRepo: Repository<CompanyVacation>;

  let orgId: string;
  let otherOrgId: string;

  beforeAll(async () => {
    const app = await createTestingApp([CompanyVacationsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(CompanyVacationsService);
    recompute = module.get(BalanceRecomputeService);

    orgRepo = dataSource.getRepository(Organization);
    vacationRepo = dataSource.getRepository(CompanyVacation);
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
    it('persists defaults and triggers recompute', async () => {
      const created = await service.create(
        {
          name: 'Sommerferien',
          startDate: '2026-07-01',
          endDate: '2026-08-15',
        },
        orgId,
      );

      expect(created.organizationId).toBe(orgId);
      expect(created.appliesToAll).toBe(true);
      expect(created.isActive).toBe(true);
      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        orgId,
        '2026-07-01',
        '2026-08-15',
      );
    });
  });

  describe('findAll', () => {
    it('returns only active vacations from the requested org', async () => {
      await service.create(
        {
          name: 'Org A',
          startDate: '2026-07-01',
          endDate: '2026-07-10',
        },
        orgId,
      );
      await service.create(
        {
          name: 'Org B',
          startDate: '2026-07-01',
          endDate: '2026-07-10',
        },
        otherOrgId,
      );
      const softDeleted = await service.create(
        {
          name: 'Gone',
          startDate: '2026-08-01',
          endDate: '2026-08-05',
        },
        orgId,
      );
      await service.remove(softDeleted.id, orgId);

      const list = await service.findAll(orgId);
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Org A');
    });
  });

  describe('update / remove (multi-tenant isolation)', () => {
    it('throws when updating a foreign-org vacation', async () => {
      const foreign = await service.create(
        {
          name: 'Fremd',
          startDate: '2026-09-01',
          endDate: '2026-09-05',
        },
        otherOrgId,
      );

      await expect(
        service.update({ id: foreign.id, name: 'Hacked' }, orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when deleting a foreign-org vacation', async () => {
      const foreign = await service.create(
        {
          name: 'Fremd',
          startDate: '2026-10-01',
          endDate: '2026-10-05',
        },
        otherOrgId,
      );

      await expect(service.remove(foreign.id, orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('updates the range and soft-deletes within the own org', async () => {
      const created = await service.create(
        {
          name: 'Alt',
          startDate: '2026-07-01',
          endDate: '2026-07-10',
        },
        orgId,
      );

      const updated = await service.update(
        {
          id: created.id,
          name: 'Neu',
          startDate: '2026-07-05',
          endDate: '2026-07-20',
        },
        orgId,
      );
      expect(updated.name).toBe('Neu');
      expect(updated.startDate).toBe('2026-07-05');
      expect(recompute.recomputeOrgRange).toHaveBeenCalledWith(
        orgId,
        '2026-07-01',
        '2026-07-20',
      );

      await service.remove(created.id, orgId);
      expect(await service.findAll(orgId)).toHaveLength(0);

      const stored = await vacationRepo.findOneByOrFail({ id: created.id });
      expect(stored.isActive).toBe(false);
    });
  });
});
