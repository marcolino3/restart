/**
 * Integration tests for EmployeeAbsenceCategoriesService against a real
 * PostgreSQL database.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=employee-absence-categories
 */
import { DataSource, Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { EmployeeAbsenceCategoriesService } from '@/employee-management/employee-absence-categories/employee-absence-categories.service';
import { EmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/entities/employee-absence-category.entity';
import { EmployeeAbsenceCategoryTranslation } from '@/employee-management/employee-absence-categories/entities/employee-absence-category-translation.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Locale } from '@/database/enums/locale.enum';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeAbsenceCategory,
      EmployeeAbsenceCategoryTranslation,
      Organization,
    ]),
  ],
  providers: [EmployeeAbsenceCategoriesService],
})
class EmployeeAbsenceCategoriesTestModule {}

describe('EmployeeAbsenceCategoriesService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: EmployeeAbsenceCategoriesService;

  let orgRepo: Repository<Organization>;

  let orgId: string;
  let otherOrgId: string;

  beforeAll(async () => {
    const app = await createTestingApp([EmployeeAbsenceCategoriesTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(EmployeeAbsenceCategoriesService);

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

  const createCustom = (name: string, organizationId = orgId) =>
    service.create(
      {
        translations: [{ locale: Locale.DE, name }],
        isPaid: true,
        countsAsWorkTime: true,
      },
      organizationId,
    );

  describe('create', () => {
    it('persists a custom category with translations', async () => {
      const created = await createCustom('Krankheit');

      expect(created.organizationId).toBe(orgId);
      expect(created.isSystem).toBe(false);
      expect(created.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: Locale.DE, name: 'Krankheit' }),
        ]),
      );
    });

    it('auto-assigns sortOrder at the end of the list', async () => {
      const first = await createCustom('A');
      const second = await createCustom('B');

      expect(first.sortOrder).toBeLessThan(second.sortOrder);
    });

    it('rejects duplicate locales in translations', async () => {
      await expect(
        service.create(
          {
            translations: [
              { locale: Locale.DE, name: 'A' },
              { locale: Locale.DE, name: 'B' },
            ],
          },
          orgId,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('accepts a single non-DE translation', async () => {
      const created = await service.create(
        {
          translations: [{ locale: Locale.EN, name: 'Sick leave' }],
          isPaid: true,
          countsAsWorkTime: true,
        },
        orgId,
      );

      expect(created.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: Locale.EN, name: 'Sick leave' }),
        ]),
      );
    });

    it('rejects when no translation name is provided', async () => {
      await expect(
        service.create(
          {
            translations: [{ locale: Locale.FR, name: '  ' }],
            isPaid: true,
            countsAsWorkTime: true,
          },
          orgId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findEmployeeAbsenceCategoriesByOrgId', () => {
    it('returns only categories from the requested org', async () => {
      await createCustom('Org A');
      await createCustom('Org B', otherOrgId);

      const list = await service.findEmployeeAbsenceCategoriesByOrgId(orgId);
      expect(list).toHaveLength(1);
      expect(list[0].translations?.[0]?.name).toBe('Org A');
    });

    it('excludes archived categories', async () => {
      const cat = await createCustom('Archiviert');
      await service.archive(cat.id, orgId);

      expect(
        await service.findEmployeeAbsenceCategoriesByOrgId(orgId),
      ).toHaveLength(0);
    });
  });

  describe('findOne (multi-tenant isolation)', () => {
    it('throws when the category belongs to another org', async () => {
      const cat = await createCustom('Fremd', otherOrgId);

      await expect(service.findOne(cat.id, orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates behavior flags and translations', async () => {
      const cat = await createCustom('Alt');

      const updated = await service.update(
        {
          id: cat.id,
          isPaid: false,
          translations: [{ locale: Locale.DE, name: 'Neu' }],
        },
        orgId,
      );

      expect(updated.isPaid).toBe(false);
      expect(updated.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: Locale.DE, name: 'Neu' }),
        ]),
      );
    });
  });

  describe('setActive', () => {
    it('toggles the active flag', async () => {
      const cat = await createCustom('Toggle');
      expect(cat.isActive).toBe(true);

      const deactivated = await service.setActive(cat.id, orgId, false);
      expect(deactivated.isActive).toBe(false);
    });
  });

  describe('reorder', () => {
    it('persists the new order', async () => {
      const a = await createCustom('A');
      const b = await createCustom('B');

      const reordered = await service.reorder([b.id, a.id], orgId);
      expect(reordered.map((c) => c.id)).toEqual([b.id, a.id]);
    });

    it('rejects ids from another org', async () => {
      const foreign = await createCustom('Fremd', otherOrgId);
      const local = await createCustom('Lokal');

      await expect(
        service.reorder([local.id, foreign.id], orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('archive', () => {
    it('archives a custom category', async () => {
      const cat = await createCustom('Custom');

      await expect(service.archive(cat.id, orgId)).resolves.toBe(true);
      await expect(service.findOne(cat.id, orgId)).resolves.toEqual(
        expect.objectContaining({ isArchived: true }),
      );
    });

    it('rejects archiving a system category', async () => {
      await service.seedOrgEmployeeAbsenceCategories(orgId);
      const [system] =
        await service.findEmployeeAbsenceCategoriesByOrgId(orgId);

      await expect(service.archive(system.id, orgId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
