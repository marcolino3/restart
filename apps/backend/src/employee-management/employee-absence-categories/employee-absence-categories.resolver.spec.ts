import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeeAbsenceCategoriesResolver } from './employee-absence-categories.resolver';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { CreateEmployeeAbsenceCategoryInput } from './dto/create-employee-absence-category.input';
import { UpdateEmployeeAbsenceCategoryInput } from './dto/update-employee-absence-category.input';
import { UpsertEmployeeAbsenceCategoryTranslationInput } from './dto/upsert-employee-absence-category-translation.input';
import { Locale } from '@/database/enums/locale.enum';

describe('EmployeeAbsenceCategoriesResolver', () => {
  let resolver: EmployeeAbsenceCategoriesResolver;
  let service: {
    seedOrgEmployeeAbsenceCategories: jest.Mock;
    resyncSystemTranslations: jest.Mock;
    findEmployeeAbsenceCategoriesByOrgId: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
    reorder: jest.Mock;
    setActive: jest.Mock;
    upsertTranslation: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      seedOrgEmployeeAbsenceCategories: jest.fn(),
      resyncSystemTranslations: jest.fn(),
      findEmployeeAbsenceCategoriesByOrgId: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      reorder: jest.fn(),
      setActive: jest.fn(),
      upsertTranslation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsenceCategoriesResolver,
        { provide: EmployeeAbsenceCategoriesService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<EmployeeAbsenceCategoriesResolver>(
      EmployeeAbsenceCategoriesResolver,
    );
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('seedSystemEmployeeAbsenceCategories', () => {
    it('delegates to the service and returns true', async () => {
      service.seedOrgEmployeeAbsenceCategories.mockResolvedValue(undefined);

      await expect(
        resolver.seedSystemEmployeeAbsenceCategories('org-1'),
      ).resolves.toBe(true);
      expect(service.seedOrgEmployeeAbsenceCategories).toHaveBeenCalledWith(
        'org-1',
      );
    });
  });

  describe('resyncSystemEmployeeAbsenceCategoryTranslations', () => {
    it('delegates to the service and returns true', async () => {
      service.resyncSystemTranslations.mockResolvedValue({
        updatedCategories: 2,
        upsertedTranslations: 8,
      });

      await expect(
        resolver.resyncSystemEmployeeAbsenceCategoryTranslations('org-1'),
      ).resolves.toBe(true);
      expect(service.resyncSystemTranslations).toHaveBeenCalledWith('org-1');
    });
  });

  describe('findEmployeeAbsenceCategoriesByOrgId', () => {
    it('scopes the query to the current org id (multi-tenant isolation)', async () => {
      const categories = [{ id: 'cat-1' }];
      service.findEmployeeAbsenceCategoriesByOrgId.mockResolvedValue(
        categories,
      );

      await expect(
        resolver.findEmployeeAbsenceCategoriesByOrgId('org-1'),
      ).resolves.toBe(categories);
      expect(service.findEmployeeAbsenceCategoriesByOrgId).toHaveBeenCalledWith(
        'org-1',
      );
    });
  });

  describe('findOne', () => {
    it('delegates with the id and current org id', async () => {
      const category = { id: 'cat-1' };
      service.findOne.mockResolvedValue(category);

      await expect(resolver.findOne('cat-1', 'org-1')).resolves.toBe(category);
      expect(service.findOne).toHaveBeenCalledWith('cat-1', 'org-1');
    });

    it('propagates NotFoundException for categories of a foreign org (multi-tenant isolation)', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException(
          'Employee absence category cat-of-other-org not found',
        ),
      );

      await expect(
        resolver.findOne('cat-of-other-org', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createEmployeeAbsenceCategory', () => {
    it('delegates with the input and current org id', async () => {
      const input = {
        translations: [{ locale: Locale.DE, name: 'Krankheit' }],
      } as CreateEmployeeAbsenceCategoryInput;
      const created = { id: 'cat-1' };
      service.create.mockResolvedValue(created);

      await expect(
        resolver.createEmployeeAbsenceCategory(input, 'org-1'),
      ).resolves.toBe(created);
      expect(service.create).toHaveBeenCalledWith(input, 'org-1');
    });
  });

  describe('updateEmployeeAbsenceCategory', () => {
    it('delegates with the input and current org id', async () => {
      const input = {
        id: 'cat-1',
        isPaid: false,
      } as UpdateEmployeeAbsenceCategoryInput;
      const updated = { id: 'cat-1', isPaid: false };
      service.update.mockResolvedValue(updated);

      await expect(
        resolver.updateEmployeeAbsenceCategory(input, 'org-1'),
      ).resolves.toBe(updated);
      expect(service.update).toHaveBeenCalledWith(input, 'org-1');
    });
  });

  describe('archiveEmployeeAbsenceCategory', () => {
    it('delegates with the id and current org id', async () => {
      service.archive.mockResolvedValue(true);

      await expect(
        resolver.archiveEmployeeAbsenceCategory('cat-1', 'org-1'),
      ).resolves.toBe(true);
      expect(service.archive).toHaveBeenCalledWith('cat-1', 'org-1');
    });
  });

  describe('reorderEmployeeAbsenceCategories', () => {
    it('delegates with the id list and current org id', async () => {
      const reordered = [{ id: 'cat-2' }, { id: 'cat-1' }];
      service.reorder.mockResolvedValue(reordered);

      await expect(
        resolver.reorderEmployeeAbsenceCategories(['cat-2', 'cat-1'], 'org-1'),
      ).resolves.toBe(reordered);
      expect(service.reorder).toHaveBeenCalledWith(['cat-2', 'cat-1'], 'org-1');
    });
  });

  describe('setEmployeeAbsenceCategoryActive', () => {
    it('delegates with id, org id and the isActive flag in the correct order', async () => {
      const updated = { id: 'cat-1', isActive: false };
      service.setActive.mockResolvedValue(updated);

      await expect(
        resolver.setEmployeeAbsenceCategoryActive('cat-1', false, 'org-1'),
      ).resolves.toBe(updated);
      expect(service.setActive).toHaveBeenCalledWith('cat-1', 'org-1', false);
    });
  });

  describe('upsertEmployeeAbsenceCategoryTranslation', () => {
    it('delegates with the input and current org id', async () => {
      const input = {
        categoryId: 'cat-1',
        locale: Locale.DE,
        name: 'Krankheit',
      } as UpsertEmployeeAbsenceCategoryTranslationInput;
      const translation = { categoryId: 'cat-1', locale: Locale.DE };
      service.upsertTranslation.mockResolvedValue(translation);

      await expect(
        resolver.upsertEmployeeAbsenceCategoryTranslation(input, 'org-1'),
      ).resolves.toBe(translation);
      expect(service.upsertTranslation).toHaveBeenCalledWith(input, 'org-1');
    });
  });
});
