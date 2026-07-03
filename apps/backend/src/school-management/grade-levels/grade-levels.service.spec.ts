import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { GradeLevelsService } from './grade-levels.service';
import { GradeLevel } from './entities/grade-level.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';

const ORG_ID = 'org-1';

type QueryBuilderMock = {
  innerJoin: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  groupBy: jest.Mock;
  getRawMany: jest.Mock;
  getCount: jest.Mock;
};

const createQueryBuilderMock = (): QueryBuilderMock => {
  const qb = {} as QueryBuilderMock;
  qb.innerJoin = jest.fn().mockReturnValue(qb);
  qb.select = jest.fn().mockReturnValue(qb);
  qb.addSelect = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.groupBy = jest.fn().mockReturnValue(qb);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getCount = jest.fn().mockResolvedValue(0);
  return qb;
};

describe('GradeLevelsService', () => {
  let service: GradeLevelsService;
  let gradeLevelRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let schoolClassRepo: { createQueryBuilder: jest.Mock };
  let qb: QueryBuilderMock;

  beforeEach(async () => {
    gradeLevelRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((v: Partial<GradeLevel>) => v),
      save: jest.fn((v: unknown) => Promise.resolve(v)),
    };
    qb = createQueryBuilderMock();
    schoolClassRepo = { createQueryBuilder: jest.fn(() => qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeLevelsService,
        { provide: getRepositoryToken(GradeLevel), useValue: gradeLevelRepo },
        { provide: getRepositoryToken(SchoolClass), useValue: schoolClassRepo },
      ],
    }).compile();

    service = module.get(GradeLevelsService);
  });

  describe('findAllByOrgId', () => {
    it('scopes the query to the organization (multi-tenant isolation)', async () => {
      gradeLevelRepo.find.mockResolvedValue([]);

      await service.findAllByOrgId(ORG_ID);

      expect(gradeLevelRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
    });

    it('maps class and student counts onto the levels, defaulting to 0', async () => {
      gradeLevelRepo.find.mockResolvedValue([
        { id: 'gl-1', name: 'Unterstufe' },
        { id: 'gl-2', name: 'Mittelstufe' },
      ]);
      qb.getRawMany
        .mockResolvedValueOnce([{ gl_id: 'gl-1', class_count: '2' }])
        .mockResolvedValueOnce([{ gl_id: 'gl-1', student_count: '24' }]);

      const result = await service.findAllByOrgId(ORG_ID);

      expect(result[0]).toMatchObject({ classCount: 2, studentCount: 24 });
      expect(result[1]).toMatchObject({ classCount: 0, studentCount: 0 });
      // Both count queries must also be org-scoped.
      expect(qb.where).toHaveBeenCalledWith(
        'sc.organizationId = :organizationId',
        { organizationId: ORG_ID },
      );
    });

    it('skips count queries when the org has no levels', async () => {
      gradeLevelRepo.find.mockResolvedValue([]);

      await expect(service.findAllByOrgId(ORG_ID)).resolves.toEqual([]);
      expect(schoolClassRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('rejects an inverted age range', async () => {
      await expect(
        service.create({ name: 'US', ageMin: 9, ageMax: 6 }, ORG_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(gradeLevelRepo.save).not.toHaveBeenCalled();
    });

    it('rejects a duplicate active name in the same org', async () => {
      gradeLevelRepo.findOne.mockResolvedValue({ id: 'gl-1', isActive: true });

      await expect(
        service.create({ name: 'Unterstufe' }, ORG_ID),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('persists new fields with the org id from the session', async () => {
      gradeLevelRepo.findOne.mockResolvedValue(null);

      await service.create(
        { name: 'Unterstufe', shortCode: 'US 1-3', ageMin: 6, ageMax: 9 },
        ORG_ID,
      );

      expect(gradeLevelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Unterstufe',
          shortCode: 'US 1-3',
          ageMin: 6,
          ageMax: 9,
          organizationId: ORG_ID,
        }),
      );
    });
  });

  describe('update', () => {
    it('validates the age range against existing values (partial update)', async () => {
      gradeLevelRepo.findOne.mockResolvedValue({
        id: 'gl-1',
        organizationId: ORG_ID,
        ageMin: 6,
        ageMax: 9,
      });

      await expect(
        service.update({ id: 'gl-1', ageMax: 3 }, ORG_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('looks the level up scoped to the org (foreign org id → NotFound)', async () => {
      gradeLevelRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update({ id: 'gl-foreign', name: 'X' }, ORG_ID),
      ).rejects.toThrow('not found');
      expect(gradeLevelRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('blocks deletion while classes are assigned', async () => {
      gradeLevelRepo.findOne.mockResolvedValue({
        id: 'gl-1',
        name: 'Unterstufe',
        organizationId: ORG_ID,
      });
      qb.getCount.mockResolvedValue(2);

      await expect(service.remove('gl-1', ORG_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
