import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Country } from '@/countries/entities/country.entity';
import { GradeLevel } from '../../grade-levels/entities/grade-level.entity';
import { SchoolClass } from '../../school-classes/entities/school-class.entity';
import { ContactPerson } from '../../contact-persons/entities/contact-person.entity';
import { RelationshipType } from '../../contact-persons/enums/relationship-type.enum';
import { Student } from '../entities/student.entity';
import { ImportStudentsInput } from './dto/import-students.input';
import { StudentImportMode } from './dto/student-import-plan.types';
import { StudentsImportService } from './students-import.service';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

const repoMock = () => ({ find: jest.fn().mockResolvedValue([]) });

/** Minimal in-memory EntityManager: records what the import would persist. */
function createManagerMock() {
  const saved: { entity: string; value: Record<string, unknown> }[] = [];
  const findOneResults = new Map<string, unknown>();
  let idSeq = 0;

  const manager = {
    saved,
    findOneResults,
    create: jest.fn(
      (entity: { name: string }, value: Record<string, unknown>) => ({
        ...value,
        __entity: entity.name,
      }),
    ),
    save: jest.fn((value: Record<string, unknown>) => {
      idSeq += 1;
      const withId = { id: value.id ?? `generated-${idSeq}`, ...value };
      saved.push({
        entity: typeof value.__entity === 'string' ? value.__entity : 'unknown',
        value: withId,
      });
      return Promise.resolve(withId);
    }),
    findOne: jest.fn((entity: { name: string }) =>
      Promise.resolve(findOneResults.get(entity.name) ?? null),
    ),
    update: jest.fn().mockResolvedValue({ affected: 0 }),
  };
  return manager;
}

function baseInput(
  overrides: Partial<ImportStudentsInput> = {},
): ImportStudentsInput {
  return {
    mode: StudentImportMode.SKIP_EXISTING,
    families: [{ key: 'fam_1', name: 'Familie Müller' }],
    contacts: [
      {
        tempId: 'c_1',
        familyKey: 'fam_1',
        firstName: 'Anna',
        lastName: 'Müller',
        email: 'anna@example.com',
      },
    ],
    students: [
      {
        tempId: 's_1',
        familyKey: 'fam_1',
        firstName: 'Lena',
        lastName: 'Müller',
        links: [
          {
            contactTempId: 'c_1',
            relationshipType: RelationshipType.MOTHER,
            isPrimaryContact: true,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('StudentsImportService', () => {
  let service: StudentsImportService;
  let manager: ReturnType<typeof createManagerMock>;
  let studentRepo: ReturnType<typeof repoMock>;
  let contactRepo: ReturnType<typeof repoMock>;
  let schoolClassRepo: ReturnType<typeof repoMock>;
  let gradeLevelRepo: ReturnType<typeof repoMock>;
  let familyRepo: ReturnType<typeof repoMock>;

  beforeEach(async () => {
    manager = createManagerMock();
    studentRepo = repoMock();
    contactRepo = repoMock();
    schoolClassRepo = repoMock();
    gradeLevelRepo = repoMock();
    familyRepo = repoMock();

    const dataSource = {
      transaction: jest.fn((cb: (m: unknown) => Promise<unknown>) =>
        cb(manager),
      ),
      getRepository: jest.fn(() => familyRepo),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsImportService,
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(ContactPerson), useValue: contactRepo },
        { provide: getRepositoryToken(SchoolClass), useValue: schoolClassRepo },
        { provide: getRepositoryToken(GradeLevel), useValue: gradeLevelRepo },
        { provide: getRepositoryToken(Country), useValue: repoMock() },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(StudentsImportService);
  });

  describe('multi-tenant isolation', () => {
    it('rejects a student id from a foreign organization', async () => {
      // Repo find is org-scoped, so a foreign id simply is not found.
      studentRepo.find.mockResolvedValue([]);

      await expect(
        service.applyPlan(
          baseInput({
            students: [
              {
                ...baseInput().students[0],
                existingStudentId: '11111111-1111-4111-8111-111111111111',
              },
            ],
          }),
          ORG_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('rejects a contact person id from a foreign organization', async () => {
      contactRepo.find.mockResolvedValue([]);

      await expect(
        service.applyPlan(
          baseInput({
            contacts: [
              {
                ...baseInput().contacts[0],
                existingContactPersonId: '22222222-2222-4222-8222-222222222222',
              },
            ],
          }),
          ORG_ID,
        ),
      ).rejects.toThrow(/contact persons do not belong/);
    });

    it('rejects a school class from a foreign organization', async () => {
      schoolClassRepo.find.mockResolvedValue([]);

      await expect(
        service.applyPlan(
          baseInput({
            students: [
              {
                ...baseInput().students[0],
                schoolClassId: '33333333-3333-4333-8333-333333333333',
              },
            ],
          }),
          ORG_ID,
        ),
      ).rejects.toThrow(/school classes do not belong/);
    });

    it('scopes every reference lookup to the active organization', async () => {
      studentRepo.find.mockResolvedValue([
        { id: '11111111-1111-4111-8111-111111111111' },
      ]);

      await service.applyPlan(
        baseInput({
          students: [
            {
              ...baseInput().students[0],
              existingStudentId: '11111111-1111-4111-8111-111111111111',
            },
          ],
        }),
        ORG_ID,
      );

      expect(studentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
      expect(studentRepo.find).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: OTHER_ORG_ID }),
        }),
      );
    });

    it('stamps the active organization on every created record', async () => {
      await service.applyPlan(baseInput(), ORG_ID);

      expect(manager.saved.length).toBeGreaterThan(0);
      for (const { value } of manager.saved) {
        expect(value.organizationId).toBe(ORG_ID);
      }
    });
  });

  describe('plan integrity', () => {
    it('rejects a contact referencing an unknown family key', async () => {
      await expect(
        service.applyPlan(
          baseInput({
            contacts: [{ ...baseInput().contacts[0], familyKey: 'nope' }],
          }),
          ORG_ID,
        ),
      ).rejects.toThrow(/unknown family/);
    });

    it('rejects a student linking an unknown contact', async () => {
      await expect(
        service.applyPlan(
          baseInput({
            students: [
              {
                ...baseInput().students[0],
                links: [
                  {
                    contactTempId: 'ghost',
                    relationshipType: RelationshipType.MOTHER,
                  },
                ],
              },
            ],
          }),
          ORG_ID,
        ),
      ).rejects.toThrow(/unknown contact/);
    });

    it('rejects duplicate temp ids', async () => {
      const input = baseInput();
      await expect(
        service.applyPlan(
          { ...input, students: [input.students[0], input.students[0]] },
          ORG_ID,
        ),
      ).rejects.toThrow(/Duplicate student tempId/);
    });
  });

  describe('re-import modes', () => {
    const existingStudentId = '44444444-4444-4444-8444-444444444444';

    beforeEach(() => {
      studentRepo.find.mockResolvedValue([{ id: existingStudentId }]);
      manager.findOneResults.set('Student', {
        id: existingStudentId,
        firstName: 'Lena',
        lastName: 'Müller',
        notes: 'Vom Sekretariat gepflegt',
        organizationId: ORG_ID,
      });
    });

    it('skips an existing student in SKIP_EXISTING mode', async () => {
      const result = await service.applyPlan(
        baseInput({
          students: [{ ...baseInput().students[0], existingStudentId }],
        }),
        ORG_ID,
      );

      expect(result.skippedStudents).toBe(1);
      expect(result.updatedStudents).toBe(0);
      expect(manager.saved.some((s) => s.entity === 'Student')).toBe(false);
    });

    it('updates an existing student in UPDATE_EXISTING mode', async () => {
      const result = await service.applyPlan(
        baseInput({
          mode: StudentImportMode.UPDATE_EXISTING,
          students: [
            {
              ...baseInput().students[0],
              existingStudentId,
              placeOfBirth: 'Zürich',
            },
          ],
        }),
        ORG_ID,
      );

      expect(result.updatedStudents).toBe(1);
      expect(result.skippedStudents).toBe(0);
      const saved = manager.saved.find((s) => s.value.id === existingStudentId);
      expect(saved?.value.placeOfBirth).toBe('Zürich');
    });

    it('never clears an existing value with an empty cell', async () => {
      await service.applyPlan(
        baseInput({
          mode: StudentImportMode.UPDATE_EXISTING,
          students: [
            {
              ...baseInput().students[0],
              existingStudentId,
              notes: undefined,
            },
          ],
        }),
        ORG_ID,
      );

      const saved = manager.saved.find((s) => s.value.id === existingStudentId);
      expect(saved?.value.notes).toBe('Vom Sekretariat gepflegt');
    });
  });

  it('creates family, contact, student, link and enrollment for a new row', async () => {
    schoolClassRepo.find.mockResolvedValue([
      { id: '55555555-5555-4555-8555-555555555555' },
    ]);

    const result = await service.applyPlan(
      baseInput({
        students: [
          {
            ...baseInput().students[0],
            schoolClassId: '55555555-5555-4555-8555-555555555555',
            enrollmentDate: '2024-08-19',
          },
        ],
      }),
      ORG_ID,
    );

    expect(result).toMatchObject({
      createdFamilies: 1,
      createdContacts: 1,
      createdStudents: 1,
      createdLinks: 1,
      createdEnrollments: 1,
    });
  });
});
