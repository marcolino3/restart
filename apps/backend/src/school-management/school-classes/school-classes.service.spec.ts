import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SchoolClassesService } from './school-classes.service';
import { SchoolClass } from './entities/school-class.entity';
import { SchoolClassTeacher } from './entities/school-class-teacher.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { SchoolClassTeacherRole } from '@/database/enums/school-class-teacher-role.enum';

const ORG_ID = 'org-1';
const TODAY = new Date().toISOString().slice(0, 10);

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
    findOne: jest.Mock;
    save: jest.Mock;
    maximum: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let qb: QueryBuilderMock;
  let assignmentRepo: {
    find: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
  let employeeRepo: { find: jest.Mock };

  beforeEach(async () => {
    qb = createQueryBuilderMock();
    schoolClassRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((v: unknown) => Promise.resolve(v)),
      maximum: jest.fn(),
      create: jest.fn((v: unknown) => v),
      createQueryBuilder: jest.fn(() => qb),
    };
    assignmentRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((v: unknown) => Promise.resolve(v)),
      update: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((v: unknown) => v),
    };
    employeeRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolClassesService,
        { provide: getRepositoryToken(SchoolClass), useValue: schoolClassRepo },
        { provide: getRepositoryToken(GradeLevel), useValue: {} },
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
        {
          provide: getRepositoryToken(SchoolClassTeacher),
          useValue: assignmentRepo,
        },
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

  describe('teacher assignments', () => {
    const employee = (id: string) => ({ id, membership: {} });

    it('derives the flat teachers list from assignments in force today', async () => {
      schoolClassRepo.findOne.mockResolvedValue({
        id: 'sc-1',
        teacherAssignments: [
          {
            employeeId: 'e-current',
            employee: employee('e-current'),
            validFrom: '2025-08-01',
            validTo: null,
          },
          {
            // Left the class last summer — must not show up today.
            employeeId: 'e-past',
            employee: employee('e-past'),
            validFrom: '2024-08-01',
            validTo: '2025-07-31',
          },
        ],
      });

      const result = await service.findOne('sc-1', ORG_ID);

      expect(result.teachers?.map((t) => t.id)).toEqual(['e-current']);
    });

    it('closes removed assignments instead of deleting them, keeping history', async () => {
      schoolClassRepo.findOne.mockResolvedValue({
        id: 'sc-1',
        teacherAssignments: [],
      });
      assignmentRepo.find.mockResolvedValue([
        { id: 'a-1', employeeId: 'e-stays' },
        { id: 'a-2', employeeId: 'e-leaves' },
      ]);
      employeeRepo.find.mockResolvedValue([employee('e-stays')]);

      await service.update({ id: 'sc-1', teacherIds: ['e-stays'] }, ORG_ID);

      // The departing teacher is end-dated...
      expect(assignmentRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.anything() }),
        { validTo: TODAY },
      );
      // ...and the one who stays is left untouched, so their role, workload
      // and start date survive an unrelated edit.
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });

    it('adds new teachers as LEAD, allowing several per class', async () => {
      schoolClassRepo.findOne.mockResolvedValue({
        id: 'sc-1',
        teacherAssignments: [],
      });
      assignmentRepo.find.mockResolvedValue([]);
      employeeRepo.find.mockResolvedValue([employee('e-1'), employee('e-2')]);

      await service.update({ id: 'sc-1', teacherIds: ['e-1', 'e-2'] }, ORG_ID);

      expect(assignmentRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({
          employeeId: 'e-1',
          role: SchoolClassTeacherRole.LEAD,
          organizationId: ORG_ID,
        }),
        expect.objectContaining({
          employeeId: 'e-2',
          role: SchoolClassTeacherRole.LEAD,
          organizationId: ORG_ID,
        }),
      ]);
    });

    it('only looks at open assignments of the caller organization', async () => {
      schoolClassRepo.findOne.mockResolvedValue({
        id: 'sc-1',
        teacherAssignments: [],
      });

      await service.update({ id: 'sc-1', teacherIds: [] }, ORG_ID);

      expect(assignmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolClassId: 'sc-1',
            organizationId: ORG_ID,
          }),
        }),
      );
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
