import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SchoolClassesService } from './school-classes.service';
import { SchoolClass } from './entities/school-class.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';

const ORG_ID = 'org-1';

type QueryBuilderMock = {
  innerJoin: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  groupBy: jest.Mock;
  getRawMany: jest.Mock;
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
  return qb;
};

describe('SchoolClassesService', () => {
  let service: SchoolClassesService;
  let schoolClassRepo: {
    find: jest.Mock;
    save: jest.Mock;
    maximum: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let qb: QueryBuilderMock;

  beforeEach(async () => {
    qb = createQueryBuilderMock();
    schoolClassRepo = {
      find: jest.fn(),
      save: jest.fn((v: unknown) => Promise.resolve(v)),
      maximum: jest.fn(),
      createQueryBuilder: jest.fn(() => qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolClassesService,
        { provide: getRepositoryToken(SchoolClass), useValue: schoolClassRepo },
        { provide: getRepositoryToken(GradeLevel), useValue: {} },
        { provide: getRepositoryToken(Employee), useValue: {} },
      ],
    }).compile();

    service = module.get(SchoolClassesService);
  });

  describe('findAllByOrgId', () => {
    it('scopes the query to the organization (multi-tenant isolation)', async () => {
      schoolClassRepo.find.mockResolvedValue([]);

      await service.findAllByOrgId(ORG_ID);

      expect(schoolClassRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
    });

    it('maps current enrollment counts onto the classes, defaulting to 0', async () => {
      schoolClassRepo.find.mockResolvedValue([
        { id: 'sc-1', name: 'Primaria A' },
        { id: 'sc-2', name: 'Primaria B' },
      ]);
      qb.getRawMany.mockResolvedValue([
        { class_id: 'sc-1', enrolled_count: '18' },
      ]);

      const result = await service.findAllByOrgId(ORG_ID);

      expect(result[0]).toMatchObject({ enrolledCount: 18 });
      expect(result[1]).toMatchObject({ enrolledCount: 0 });
      // The count query must also be org-scoped.
      expect(qb.where).toHaveBeenCalledWith(
        'sc.organizationId = :organizationId',
        { organizationId: ORG_ID },
      );
    });

    it('skips the count query when the org has no classes', async () => {
      schoolClassRepo.find.mockResolvedValue([]);

      await expect(service.findAllByOrgId(ORG_ID)).resolves.toEqual([]);
      expect(schoolClassRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    it('rejects ids that do not all belong to the organization', async () => {
      schoolClassRepo.find.mockResolvedValue([{ id: 'sc-1' }]);

      await expect(
        service.reorder({ ids: ['sc-1', 'sc-foreign'] }, ORG_ID),
      ).rejects.toThrow('not found');
      expect(schoolClassRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
      expect(schoolClassRepo.save).not.toHaveBeenCalled();
    });

    it('persists the new order as sortOrder indexes', async () => {
      const a = { id: 'sc-a', sortOrder: 0 };
      const b = { id: 'sc-b', sortOrder: 1 };
      schoolClassRepo.find
        .mockResolvedValueOnce([a, b]) // reorder lookup
        .mockResolvedValueOnce([b, a]); // findAllByOrgId afterwards

      await service.reorder({ ids: ['sc-b', 'sc-a'] }, ORG_ID);

      expect(schoolClassRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'sc-b', sortOrder: 0 }),
        expect.objectContaining({ id: 'sc-a', sortOrder: 1 }),
      ]);
    });
  });
});
