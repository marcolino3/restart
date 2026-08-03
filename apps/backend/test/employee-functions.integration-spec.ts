/**
 * Integration tests for EmployeeFunctionsService against a real PostgreSQL database.
 *
 * Covers entity/constraint mapping, translation persistence, reorder, and
 * multi-tenant isolation that mock-based unit tests cannot verify.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=employee-functions
 */
import { DataSource, Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { EmployeeFunctionsService } from '@/employee-management/employee-functions/employee-functions.service';
import { EmployeeFunction } from '@/employee-management/employee-functions/entities/employee-function.entity';
import { EmployeeFunctionTranslation } from '@/employee-management/employee-functions/entities/employee-function-translation.entity';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Locale } from '@/database/enums/locale.enum';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeFunction,
      EmployeeFunctionTranslation,
      EmployeeContract,
      Organization,
    ]),
  ],
  providers: [EmployeeFunctionsService],
})
class EmployeeFunctionsTestModule {}

describe('EmployeeFunctionsService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: EmployeeFunctionsService;

  let orgRepo: Repository<Organization>;

  let orgId: string;
  let otherOrgId: string;

  beforeAll(async () => {
    const app = await createTestingApp([EmployeeFunctionsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(EmployeeFunctionsService);

    orgRepo = dataSource.getRepository(Organization);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);

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
    it('persists translations and scopes to the org', async () => {
      const created = await service.create(
        {
          translations: [
            { locale: Locale.DE, name: 'Lehrperson' },
            { locale: Locale.EN, name: 'Teacher' },
          ],
        },
        orgId,
      );

      expect(created.organizationId).toBe(orgId);
      expect(created.name).toBe('Lehrperson');
      expect(created.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: Locale.DE, name: 'Lehrperson' }),
          expect.objectContaining({ locale: Locale.EN, name: 'Teacher' }),
        ]),
      );
    });

    it('rejects duplicate canonical names within the same org', async () => {
      await service.create(
        { translations: [{ locale: Locale.DE, name: 'Sekretariat' }] },
        orgId,
      );

      await expect(
        service.create(
          { translations: [{ locale: Locale.DE, name: 'Sekretariat' }] },
          orgId,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('auto-assigns sortOrder at the end of the list', async () => {
      const first = await service.create(
        { translations: [{ locale: Locale.DE, name: 'A' }] },
        orgId,
      );
      const second = await service.create(
        { translations: [{ locale: Locale.DE, name: 'B' }] },
        orgId,
      );

      expect(first.sortOrder).toBeLessThan(second.sortOrder);
    });
  });

  describe('findAllByOrgId', () => {
    it('returns only functions from the requested org', async () => {
      await service.create(
        { translations: [{ locale: Locale.DE, name: 'Org A' }] },
        orgId,
      );
      await service.create(
        { translations: [{ locale: Locale.DE, name: 'Org B' }] },
        otherOrgId,
      );

      const list = await service.findAllByOrgId(orgId);
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Org A');
    });

    it('excludes archived functions by default', async () => {
      const fn = await service.create(
        { translations: [{ locale: Locale.DE, name: 'Archiviert' }] },
        orgId,
      );
      await service.archive(fn.id, orgId);

      expect(await service.findAllByOrgId(orgId)).toHaveLength(0);
      expect(await service.findAllByOrgId(orgId, true)).toHaveLength(1);
    });
  });

  describe('findOne (multi-tenant isolation)', () => {
    it('throws when the function belongs to another org', async () => {
      const fn = await service.create(
        { translations: [{ locale: Locale.DE, name: 'Fremd' }] },
        otherOrgId,
      );

      await expect(service.findOne(fn.id, orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates translations and the canonical name', async () => {
      const fn = await service.create(
        { translations: [{ locale: Locale.DE, name: 'Alt' }] },
        orgId,
      );

      const updated = await service.update(
        {
          id: fn.id,
          translations: [
            { locale: Locale.DE, name: 'Neu' },
            { locale: Locale.EN, name: 'New' },
          ],
        },
        orgId,
      );

      expect(updated.name).toBe('Neu');
      expect(updated.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: Locale.EN, name: 'New' }),
        ]),
      );
    });
  });

  describe('reorder', () => {
    it('persists the new order', async () => {
      const a = await service.create(
        { translations: [{ locale: Locale.DE, name: 'A' }] },
        orgId,
      );
      const b = await service.create(
        { translations: [{ locale: Locale.DE, name: 'B' }] },
        orgId,
      );

      const reordered = await service.reorder([b.id, a.id], orgId);
      expect(reordered.map((f) => f.id)).toEqual([b.id, a.id]);
      expect(reordered[0].sortOrder).toBe(0);
      expect(reordered[1].sortOrder).toBe(1);
    });

    it('rejects ids from another org', async () => {
      const foreign = await service.create(
        { translations: [{ locale: Locale.DE, name: 'Fremd' }] },
        otherOrgId,
      );
      const local = await service.create(
        { translations: [{ locale: Locale.DE, name: 'Lokal' }] },
        orgId,
      );

      await expect(
        service.reorder([local.id, foreign.id], orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('hard-deletes an unused function', async () => {
      const fn = await service.create(
        { translations: [{ locale: Locale.DE, name: 'Löschbar' }] },
        orgId,
      );

      await expect(service.remove(fn.id, orgId)).resolves.toBe(true);
      await expect(service.findOne(fn.id, orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
