import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';

import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';
import { EmployeeAbsenceCategory } from './entities/employee-absence-category.entity';
import { EmployeeAbsenceCategoryTranslation } from './entities/employee-absence-category-translation.entity';
import { Locale } from '@/database/enums/locale.enum';

const ORG_ID = 'org-1';

const createQb = (max: number | null) => ({
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ max }),
});

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn((v) => v),
  save: jest.fn((v) =>
    Promise.resolve(Array.isArray(v) ? v : { id: 'cat-1', ...v }),
  ),
  upsert: jest.fn(),
  createQueryBuilder: jest.fn(() => createQb(null)),
});

describe('EmployeeAbsenceCategoriesService', () => {
  let service: EmployeeAbsenceCategoriesService;
  let categoriesRepo: ReturnType<typeof createMockRepository>;
  let translationsRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let entityManager: { transaction: jest.Mock };

  beforeEach(async () => {
    categoriesRepo = createMockRepository();
    translationsRepo = createMockRepository();
    dataSource = {
      transaction: jest.fn((cb) =>
        cb({
          getRepository: (entity: unknown) =>
            entity === EmployeeAbsenceCategoryTranslation
              ? translationsRepo
              : {
                  ...categoriesRepo,
                  createQueryBuilder: jest.fn(() => createQb(null)),
                },
        }),
      ),
    };
    entityManager = {
      transaction: jest.fn((cb) => cb({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsenceCategoriesService,
        {
          provide: getRepositoryToken(EmployeeAbsenceCategory),
          useValue: categoriesRepo,
        },
        {
          provide: getRepositoryToken(EmployeeAbsenceCategoryTranslation),
          useValue: translationsRepo,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: EntityManager, useValue: entityManager },
      ],
    }).compile();

    service = module.get(EmployeeAbsenceCategoriesService);
  });

  describe('findEmployeeAbsenceCategoriesByOrgId', () => {
    it('scopes to the org and excludes archived categories', async () => {
      await service.findEmployeeAbsenceCategoriesByOrgId(ORG_ID);

      expect(categoriesRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID, isArchived: false },
          relations: ['translations'],
        }),
      );
    });
  });

  describe('findOne (multi-tenant isolation)', () => {
    it('throws when the category belongs to another org', async () => {
      categoriesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('cat-foreign', ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(categoriesRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-foreign', organizationId: ORG_ID },
        relations: ['translations'],
      });
    });
  });

  describe('create', () => {
    it('stamps the org and persists translations', async () => {
      categoriesRepo.save.mockImplementation((v) =>
        Promise.resolve({ id: 'cat-1', ...v }),
      );
      categoriesRepo.findOne.mockResolvedValue({
        id: 'cat-1',
        organizationId: ORG_ID,
        translations: [{ locale: Locale.DE, name: 'Krankheit' }],
      });

      await service.create(
        {
          translations: [{ locale: Locale.DE, name: 'Krankheit' }],
        },
        ORG_ID,
      );

      expect(categoriesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          isSystem: false,
        }),
      );
      expect(translationsRepo.save).toHaveBeenCalled();
    });

    it('persists the self-service range settings', async () => {
      categoriesRepo.save.mockImplementation((v) =>
        Promise.resolve({ id: 'cat-1', ...v }),
      );
      categoriesRepo.findOne.mockResolvedValue({
        id: 'cat-1',
        organizationId: ORG_ID,
        translations: [{ locale: Locale.DE, name: 'Kompensation' }],
      });

      await service.create(
        {
          translations: [{ locale: Locale.DE, name: 'Kompensation' }],
          allowsDateRange: true,
          maxDaysPerRequest: 5,
        },
        ORG_ID,
      );

      expect(categoriesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          allowsDateRange: true,
          maxDaysPerRequest: 5,
        }),
      );
    });

    it('rejects maxDaysPerRequest without allowsDateRange', async () => {
      await expect(
        service.create(
          {
            translations: [{ locale: Locale.DE, name: 'Umzug' }],
            allowsDateRange: false,
            maxDaysPerRequest: 1,
          },
          ORG_ID,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(categoriesRepo.create).not.toHaveBeenCalled();
    });

    it('rejects duplicate locales', async () => {
      await expect(
        service.create(
          {
            translations: [
              { locale: Locale.DE, name: 'A' },
              { locale: Locale.DE, name: 'B' },
            ],
          },
          ORG_ID,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('accepts a single non-DE translation', async () => {
      categoriesRepo.save.mockImplementation((v) =>
        Promise.resolve({ id: 'cat-1', ...v }),
      );
      categoriesRepo.findOne.mockResolvedValue({
        id: 'cat-1',
        organizationId: ORG_ID,
        translations: [{ locale: Locale.EN, name: 'Sick leave' }],
      });

      await service.create(
        {
          translations: [{ locale: Locale.EN, name: 'Sick leave' }],
        },
        ORG_ID,
      );

      expect(translationsRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ locale: Locale.EN, name: 'Sick leave' }),
      ]);
    });

    it('rejects when no translation name is provided', async () => {
      await expect(
        service.create(
          {
            translations: [{ locale: Locale.DE, name: '  ' }],
          },
          ORG_ID,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('auto-assigns sortOrder when omitted', async () => {
      const txQb = createQb(2);
      categoriesRepo.save.mockImplementation((v) =>
        Promise.resolve({ id: 'cat-1', ...v }),
      );
      categoriesRepo.findOne.mockResolvedValue({
        id: 'cat-1',
        organizationId: ORG_ID,
        translations: [],
      });
      dataSource.transaction.mockImplementation((cb) =>
        cb({
          getRepository: (entity: unknown) =>
            entity === EmployeeAbsenceCategoryTranslation
              ? translationsRepo
              : {
                  ...categoriesRepo,
                  createQueryBuilder: jest.fn(() => txQb),
                },
        }),
      );

      await service.create(
        { translations: [{ locale: Locale.DE, name: 'Neu' }] },
        ORG_ID,
      );

      expect(categoriesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sortOrder: 3 }),
      );
    });
  });

  describe('update', () => {
    const existing = {
      id: 'cat-1',
      organizationId: ORG_ID,
      isPaid: true,
      translations: [{ locale: Locale.DE, name: 'Alt' }],
    };

    it('updates behavior flags', async () => {
      categoriesRepo.findOne
        .mockResolvedValueOnce({ ...existing })
        .mockResolvedValueOnce({ ...existing, isPaid: false });

      const result = await service.update(
        { id: 'cat-1', isPaid: false },
        ORG_ID,
      );

      expect(categoriesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isPaid: false }),
      );
      expect(result.isPaid).toBe(false);
    });

    it('updates the range settings', async () => {
      categoriesRepo.findOne
        .mockResolvedValueOnce({ ...existing, allowsDateRange: false })
        .mockResolvedValueOnce({
          ...existing,
          allowsDateRange: true,
          maxDaysPerRequest: 3,
        });

      const result = await service.update(
        { id: 'cat-1', allowsDateRange: true, maxDaysPerRequest: 3 },
        ORG_ID,
      );

      expect(categoriesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          allowsDateRange: true,
          maxDaysPerRequest: 3,
        }),
      );
      expect(result.maxDaysPerRequest).toBe(3);
    });

    it('rejects turning off allowsDateRange while maxDaysPerRequest is set', async () => {
      categoriesRepo.findOne.mockResolvedValueOnce({
        ...existing,
        allowsDateRange: true,
        maxDaysPerRequest: 3,
      });

      await expect(
        service.update({ id: 'cat-1', allowsDateRange: false }, ORG_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(categoriesRepo.save).not.toHaveBeenCalled();
    });

    it('rejects when the category belongs to another org', async () => {
      categoriesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update({ id: 'cat-foreign', isPaid: false }, ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('archive', () => {
    it('marks a custom category as archived', async () => {
      const cat = {
        id: 'cat-1',
        organizationId: ORG_ID,
        isSystem: false,
        isArchived: false,
      };
      categoriesRepo.findOne.mockResolvedValue(cat);

      await expect(service.archive('cat-1', ORG_ID)).resolves.toBe(true);
      expect(categoriesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isArchived: true }),
      );
    });

    it('rejects archiving a system category', async () => {
      categoriesRepo.findOne.mockResolvedValue({
        id: 'cat-1',
        organizationId: ORG_ID,
        isSystem: true,
      });

      await expect(service.archive('cat-1', ORG_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('reorder', () => {
    it('persists the new order and returns the org list', async () => {
      const catA = {
        id: 'a',
        organizationId: ORG_ID,
        sortOrder: 0,
        translations: [],
      };
      const catB = {
        id: 'b',
        organizationId: ORG_ID,
        sortOrder: 1,
        translations: [],
      };
      categoriesRepo.find
        .mockResolvedValueOnce([catA, catB])
        .mockResolvedValueOnce([
          { ...catB, sortOrder: 0 },
          { ...catA, sortOrder: 1 },
        ]);

      const result = await service.reorder(['b', 'a'], ORG_ID);

      expect(categoriesRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'b', sortOrder: 0 }),
        expect.objectContaining({ id: 'a', sortOrder: 1 }),
      ]);
      expect(result).toHaveLength(2);
    });

    it('rejects when any id is missing from the org', async () => {
      categoriesRepo.find.mockResolvedValue([
        { id: 'a', organizationId: ORG_ID },
      ]);

      await expect(service.reorder(['a', 'b'], ORG_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(categoriesRepo.find.mock.calls[0][0].where).toEqual({
        id: In(['a', 'b']),
        organizationId: ORG_ID,
      });
    });
  });

  describe('setActive', () => {
    it('toggles the active flag', async () => {
      const cat = {
        id: 'cat-1',
        organizationId: ORG_ID,
        isActive: true,
        translations: [],
      };
      categoriesRepo.findOne
        .mockResolvedValueOnce(cat)
        .mockResolvedValueOnce({ ...cat, isActive: false });

      const result = await service.setActive('cat-1', ORG_ID, false);

      expect(categoriesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('getDefaultIsVacationCapable', () => {
    it('returns the category default', async () => {
      categoriesRepo.findOne.mockResolvedValue({
        id: 'cat-1',
        defaultIsVacationCapable: false,
      });

      await expect(
        service.getDefaultIsVacationCapable('cat-1', ORG_ID),
      ).resolves.toBe(false);
    });
  });
});
