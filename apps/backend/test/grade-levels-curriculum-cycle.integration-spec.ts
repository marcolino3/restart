/**
 * Resolving a class (or a child) to its curriculum cycle, against a real
 * database.
 *
 * These two queries are hand-written SQL against a TypeORM-generated join
 * table, and the unit suite mocks the query builder — so it happily accepted
 * column names that do not exist. All four were wrong:
 * `scgl.grade_level_id` / `scgl.school_class_id` (the generated table uses
 * quoted camelCase, `"gradeLevelsId"` / `"schoolClassesId"`), `sce.is_active`
 * and `gl.sort_order` (both quoted camelCase too). Every lookup therefore
 * failed, and the progress screen showed no curriculum at all — with a
 * correctly configured stage and class.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=grade-levels-curriculum-cycle
 */
import { DataSource, Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { GradeLevelsService } from '@/school-management/grade-levels/grade-levels.service';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { Curriculum } from '@/curricula/entities/curriculum.entity';
import { CurriculumLevel } from '@/curricula/entities/curriculum-level.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GradeLevel,
      SchoolClass,
      Curriculum,
      CurriculumLevel,
      Organization,
    ]),
  ],
  providers: [GradeLevelsService],
})
class GradeLevelsTestModule {}

describe('GradeLevels curriculum-cycle lookup (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: GradeLevelsService;

  let orgRepo: Repository<Organization>;
  let gradeLevelRepo: Repository<GradeLevel>;
  let schoolClassRepo: Repository<SchoolClass>;
  let studentRepo: Repository<Student>;
  let enrollmentRepo: Repository<SchoolClassEnrollment>;
  let curriculumRepo: Repository<Curriculum>;
  let levelRepo: Repository<CurriculumLevel>;

  let orgId: string;
  let cycleId: string;

  beforeAll(async () => {
    const app = await createTestingApp([GradeLevelsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(GradeLevelsService);

    orgRepo = dataSource.getRepository(Organization);
    gradeLevelRepo = dataSource.getRepository(GradeLevel);
    schoolClassRepo = dataSource.getRepository(SchoolClass);
    studentRepo = dataSource.getRepository(Student);
    enrollmentRepo = dataSource.getRepository(SchoolClassEnrollment);
    curriculumRepo = dataSource.getRepository(Curriculum);
    levelRepo = dataSource.getRepository(CurriculumLevel);
  });

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

    const curriculum = await curriculumRepo.save(
      curriculumRepo.create({ slug: 'primarschule', organizationId: orgId }),
    );
    const level = await levelRepo.save(
      levelRepo.create({
        slug: 'zyklus-1',
        curriculumId: curriculum.id,
        organizationId: orgId,
        position: 0,
      }),
    );
    cycleId = level.id;
  });

  /** Stage linked to the cycle, class linked to the stage — the happy path. */
  const setUpClassWithCycle = async (): Promise<string> => {
    const stage = await gradeLevelRepo.save(
      gradeLevelRepo.create({
        name: 'Unterstufe',
        organizationId: orgId,
        sortOrder: 0,
        curriculumLevelId: cycleId,
      }),
    );
    const schoolClass = await schoolClassRepo.save(
      schoolClassRepo.create({
        name: 'Klasse PA',
        organizationId: orgId,
        sortOrder: 0,
        gradeLevels: [stage],
      }),
    );
    return schoolClass.id;
  };

  describe('by class', () => {
    it('resolves the cycle through the class stages', async () => {
      const schoolClassId = await setUpClassWithCycle();

      await expect(
        service.findCurriculumLevelIdForSchoolClass(schoolClassId, orgId),
      ).resolves.toBe(cycleId);
    });

    it('returns null when the stage has no cycle', async () => {
      const stage = await gradeLevelRepo.save(
        gradeLevelRepo.create({
          name: 'Ohne Zyklus',
          organizationId: orgId,
          sortOrder: 0,
        }),
      );
      const schoolClass = await schoolClassRepo.save(
        schoolClassRepo.create({
          name: 'Klasse X',
          organizationId: orgId,
          sortOrder: 0,
          gradeLevels: [stage],
        }),
      );

      await expect(
        service.findCurriculumLevelIdForSchoolClass(schoolClass.id, orgId),
      ).resolves.toBeNull();
    });

    it('returns null for a class of another organization', async () => {
      const schoolClassId = await setUpClassWithCycle();
      const other = await orgRepo.save(
        orgRepo.create({ name: 'Fremd', subdomain: `f${Date.now()}` }),
      );

      await expect(
        service.findCurriculumLevelIdForSchoolClass(schoolClassId, other.id),
      ).resolves.toBeNull();
    });

    it('picks the first stage that has a cycle, by sort order', async () => {
      const withoutCycle = await gradeLevelRepo.save(
        gradeLevelRepo.create({
          name: 'Erst, ohne Zyklus',
          organizationId: orgId,
          sortOrder: 0,
        }),
      );
      const withCycle = await gradeLevelRepo.save(
        gradeLevelRepo.create({
          name: 'Zweit, mit Zyklus',
          organizationId: orgId,
          sortOrder: 1,
          curriculumLevelId: cycleId,
        }),
      );
      const schoolClass = await schoolClassRepo.save(
        schoolClassRepo.create({
          name: 'Gemischt',
          organizationId: orgId,
          sortOrder: 0,
          gradeLevels: [withoutCycle, withCycle],
        }),
      );

      await expect(
        service.findCurriculumLevelIdForSchoolClass(schoolClass.id, orgId),
      ).resolves.toBe(cycleId);
    });
  });

  describe('by student', () => {
    const enrol = async (schoolClassId: string): Promise<string> => {
      const student = await studentRepo.save(
        studentRepo.create({
          firstName: 'Levin',
          lastName: 'Baumann',
          organizationId: orgId,
        }),
      );
      await enrollmentRepo.save(
        enrollmentRepo.create({
          studentId: student.id,
          schoolClassId,
          organizationId: orgId,
          enrolledAt: '2025-08-01',
        }),
      );
      return student.id;
    };

    it('resolves the cycle through the enrolment', async () => {
      const schoolClassId = await setUpClassWithCycle();
      const studentId = await enrol(schoolClassId);

      await expect(
        service.findCurriculumLevelIdForStudent(studentId, orgId),
      ).resolves.toBe(cycleId);
    });

    it('ignores an enrolment the child has already left', async () => {
      const schoolClassId = await setUpClassWithCycle();
      const studentId = await enrol(schoolClassId);
      await enrollmentRepo.update({ studentId }, { leftAt: '2026-07-31' });

      await expect(
        service.findCurriculumLevelIdForStudent(studentId, orgId),
      ).resolves.toBeNull();
    });

    it('returns null for a child of another organization', async () => {
      const schoolClassId = await setUpClassWithCycle();
      const studentId = await enrol(schoolClassId);
      const other = await orgRepo.save(
        orgRepo.create({ name: 'Fremd', subdomain: `f${Date.now()}` }),
      );

      await expect(
        service.findCurriculumLevelIdForStudent(studentId, other.id),
      ).resolves.toBeNull();
    });
  });
});
