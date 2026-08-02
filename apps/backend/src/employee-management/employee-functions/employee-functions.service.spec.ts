import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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
  save: jest.fn((v) => Promise.resolve(Array.isArray(v) ? v : { id: 'fn-1', ...v })),
  remove: jest.fn(),
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
      transaction: jest.fn(async (cb) =>
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
        service.create({ translations: [{ locale: Locale.DE, name: '  ' }] }, ORG_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('reorder', () => {
    it('rejects when any id is missing from the org', async () => {
      fnRepo.find.mockResolvedValue([{ id: 'a', organizationId: ORG_ID }]);
      await expect(
        service.reorder(['a', 'b'], ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
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
