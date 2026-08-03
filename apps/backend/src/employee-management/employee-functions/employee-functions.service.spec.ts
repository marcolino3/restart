import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';

import { EmployeeFunctionsService } from './employee-functions.service';
import { EmployeeFunction } from './entities/employee-function.entity';
import { EmployeeFunctionTranslation } from './entities/employee-function-translation.entity';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Locale } from '@/database/enums/locale.enum';

const ORG_ID = 'org-1';

const createQb = (max: number | null) => ({
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ max }),
  getOne: jest.fn().mockResolvedValue(null),
});

const createContractQb = (cnt: number) => ({
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ cnt: String(cnt) }),
  getOne: jest.fn().mockResolvedValue(null),
});

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn((v) => v),
  save: jest.fn((v) =>
    Promise.resolve(Array.isArray(v) ? v : { id: 'fn-1', ...v }),
  ),
  remove: jest.fn(),
  delete: jest.fn(),
  upsert: jest.fn(),
  createQueryBuilder: jest.fn(() => createQb(null)),
  manager: { transaction: jest.fn() },
});

describe('EmployeeFunctionsService', () => {
  let service: EmployeeFunctionsService;
  let fnRepo: ReturnType<typeof createMockRepository>;
  let trRepo: ReturnType<typeof createMockRepository>;
  let contractRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    fnRepo = createMockRepository();
    trRepo = createMockRepository();
    contractRepo = createMockRepository();
    contractRepo.createQueryBuilder.mockReturnValue(createContractQb(0));
    dataSource = {
      transaction: jest.fn((cb) =>
        cb({
          getRepository: (entity: unknown) =>
            entity === EmployeeFunctionTranslation ? trRepo : fnRepo,
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeFunctionsService,
        {
          provide: getRepositoryToken(EmployeeFunction),
          useValue: fnRepo,
        },
        {
          provide: getRepositoryToken(EmployeeFunctionTranslation),
          useValue: trRepo,
        },
        {
          provide: getRepositoryToken(EmployeeContract),
          useValue: contractRepo,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(EmployeeFunctionsService);
  });

  describe('findAllByOrgId', () => {
    it('scopes to the org and loads translations', async () => {
      fnRepo.find.mockResolvedValue([
        {
          id: 'fn-1',
          name: 'Lehrperson',
          organizationId: ORG_ID,
          translations: [],
        },
      ]);
      await service.findAllByOrgId(ORG_ID);
      const args = fnRepo.find.mock.calls[0][0];
      expect(args.where).toEqual({ organizationId: ORG_ID, isArchived: false });
      expect(args.relations).toEqual(['translations']);
    });

    it('includes archived functions when requested', async () => {
      fnRepo.find.mockResolvedValue([]);
      await service.findAllByOrgId(ORG_ID, true);
      expect(fnRepo.find.mock.calls[0][0].where).toEqual({
        organizationId: ORG_ID,
      });
    });
  });

  describe('findOne (multi-tenant isolation)', () => {
    it('throws when the function belongs to another org', async () => {
      fnRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('f-1', ORG_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(fnRepo.findOne.mock.calls[0][0].where).toEqual({
        id: 'f-1',
        organizationId: ORG_ID,
      });
    });
  });

  describe('create', () => {
    it('requires at least one translation and stamps the org', async () => {
      fnRepo.findOne.mockResolvedValue({ id: 'fn-1', organizationId: ORG_ID });
      await service.create(
        {
          translations: [
            { locale: Locale.DE, name: 'Lehrperson' },
            { locale: Locale.EN, name: 'Teacher' },
          ],
        },
        ORG_ID,
      );
      expect(fnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Lehrperson',
          organizationId: ORG_ID,
        }),
      );
      expect(trRepo.upsert).toHaveBeenCalled();
    });

    it('accepts a single non-DE translation as canonical name', async () => {
      fnRepo.findOne.mockResolvedValue({ id: 'fn-1', organizationId: ORG_ID });
      await service.create(
        {
          translations: [{ locale: Locale.EN, name: 'Teacher' }],
        },
        ORG_ID,
      );
      expect(fnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Teacher',
          organizationId: ORG_ID,
        }),
      );
    });

    it('rejects when no translation is provided', async () => {
      await expect(
        service.create(
          { translations: [{ locale: Locale.DE, name: '  ' }] },
          ORG_ID,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects duplicate canonical names in the same org', async () => {
      fnRepo.createQueryBuilder.mockReturnValue({
        ...createQb(null),
        getOne: jest
          .fn()
          .mockResolvedValue({ id: 'fn-existing', name: 'Lehrperson' }),
      });

      await expect(
        service.create(
          { translations: [{ locale: Locale.DE, name: 'Lehrperson' }] },
          ORG_ID,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('auto-assigns sortOrder when omitted', async () => {
      fnRepo.findOne.mockResolvedValue({ id: 'fn-1', organizationId: ORG_ID });
      const txQb = createQb(4);
      dataSource.transaction.mockImplementation((cb) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === EmployeeFunctionTranslation) return trRepo;
            return {
              ...fnRepo,
              createQueryBuilder: jest.fn(() => txQb),
            };
          },
        }),
      );

      await service.create(
        { translations: [{ locale: Locale.DE, name: 'Sekretariat' }] },
        ORG_ID,
      );

      expect(fnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sortOrder: 5 }),
      );
    });
  });

  describe('update', () => {
    const existing = {
      id: 'fn-1',
      name: 'Lehrperson',
      organizationId: ORG_ID,
      translations: [{ locale: Locale.DE, name: 'Lehrperson' }],
    };

    it('updates translations and the canonical name', async () => {
      fnRepo.findOne.mockResolvedValue({ ...existing });
      await service.update(
        {
          id: 'fn-1',
          translations: [
            { locale: Locale.DE, name: 'Neue Rolle' },
            { locale: Locale.EN, name: 'New role' },
          ],
        },
        ORG_ID,
      );

      expect(fnRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Neue Rolle' }),
      );
      expect(trRepo.upsert).toHaveBeenCalled();
    });

    it('deletes translations when an empty name is sent', async () => {
      fnRepo.findOne.mockResolvedValue({
        ...existing,
        translations: [
          { locale: Locale.DE, name: 'Lehrperson' },
          { locale: Locale.EN, name: 'Teacher' },
        ],
      });

      await service.update(
        {
          id: 'fn-1',
          translations: [
            { locale: Locale.DE, name: 'Lehrperson' },
            { locale: Locale.EN, name: '' },
          ],
        },
        ORG_ID,
      );

      expect(trRepo.delete).toHaveBeenCalledWith({
        functionId: 'fn-1',
        locale: Locale.EN,
      });
    });

    it('rejects when the function belongs to another org', async () => {
      fnRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(
          {
            id: 'fn-foreign',
            translations: [{ locale: Locale.DE, name: 'Lehrperson' }],
          },
          ORG_ID,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects renaming to an existing canonical name', async () => {
      fnRepo.findOne.mockResolvedValue({ ...existing });
      fnRepo.createQueryBuilder.mockReturnValue({
        ...createQb(null),
        getOne: jest
          .fn()
          .mockResolvedValue({ id: 'fn-2', name: 'Sekretariat' }),
      });

      await expect(
        service.update(
          {
            id: 'fn-1',
            translations: [{ locale: Locale.DE, name: 'Sekretariat' }],
          },
          ORG_ID,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('archive', () => {
    it('marks the function as archived', async () => {
      const fn = {
        id: 'fn-1',
        name: 'Lehrperson',
        organizationId: ORG_ID,
        isArchived: false,
        translations: [],
      };
      fnRepo.findOne.mockResolvedValue(fn);

      await expect(service.archive('fn-1', ORG_ID)).resolves.toBe(true);
      expect(fnRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isArchived: true }),
      );
    });

    it('rejects when the function belongs to another org', async () => {
      fnRepo.findOne.mockResolvedValue(null);

      await expect(
        service.archive('fn-foreign', ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('persists the new order and returns the org list', async () => {
      const fnA = {
        id: 'a',
        organizationId: ORG_ID,
        sortOrder: 0,
        translations: [],
      };
      const fnB = {
        id: 'b',
        organizationId: ORG_ID,
        sortOrder: 1,
        translations: [],
      };
      fnRepo.find.mockResolvedValueOnce([fnA, fnB]).mockResolvedValueOnce([
        { ...fnB, sortOrder: 0 },
        { ...fnA, sortOrder: 1 },
      ]);

      const result = await service.reorder(['b', 'a'], ORG_ID);

      expect(fnRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'b', sortOrder: 0 }),
        expect.objectContaining({ id: 'a', sortOrder: 1 }),
      ]);
      expect(result).toHaveLength(2);
    });

    it('rejects when any id is missing from the org', async () => {
      fnRepo.find.mockResolvedValue([{ id: 'a', organizationId: ORG_ID }]);
      await expect(service.reorder(['a', 'b'], ORG_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(fnRepo.find.mock.calls[0][0].where).toEqual({
        id: In(['a', 'b']),
        organizationId: ORG_ID,
      });
    });
  });

  describe('remove', () => {
    const fn = {
      id: 'fn-1',
      name: 'Lehrperson',
      organizationId: ORG_ID,
      translations: [{ locale: Locale.DE, name: 'Lehrperson' }],
    };

    it('hard-deletes when no employee uses the function', async () => {
      fnRepo.findOne.mockResolvedValue(fn);
      contractRepo.createQueryBuilder.mockReturnValue(createContractQb(0));

      await expect(service.remove('fn-1', ORG_ID)).resolves.toBe(true);
      expect(fnRepo.remove).toHaveBeenCalledWith(fn);
    });

    it('rejects delete when employees still reference the function', async () => {
      fnRepo.findOne.mockResolvedValue(fn);
      contractRepo.createQueryBuilder.mockReturnValue(createContractQb(2));

      await expect(service.remove('fn-1', ORG_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(fnRepo.remove).not.toHaveBeenCalled();
    });
  });
});
