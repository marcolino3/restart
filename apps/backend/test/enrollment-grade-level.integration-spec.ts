/**
 * Assigning a child to a subgroup of its class, against a real database.
 *
 * The kanban drags children between the subgroups of a class (US1–US3 inside
 * "Unterstufe"), which writes school_class_enrollments.grade_level_id. Two
 * things have to hold and neither is visible to a mock: the subgroup must
 * belong to the class the child is being placed in, and moving within the
 * same class must not cut the enrolment history in two.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=enrollment-grade-level
 */
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, Module, NotFoundException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { SchoolClassEnrollmentsService } from '@/school-management/school-class-enrollments/school-class-enrollments.service';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolClassEnrollment,
      SchoolClass,
      GradeLevel,
      Student,
      Organization,
    ]),
  ],
  providers: [SchoolClassEnrollmentsService],
})
class EnrollmentsTestModule {}

describe('Enrollment grade level (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: SchoolClassEnrollmentsService;

  let orgRepo: Repository<Organization>;
  let gradeLevelRepo: Repository<GradeLevel>;
  let schoolClassRepo: Repository<SchoolClass>;
  let studentRepo: Repository<Student>;
  let enrollmentRepo: Repository<SchoolClassEnrollment>;

  let orgId: string;
  let mainStageId: string;
  let us1Id: string;
  let us2Id: string;
  let schoolClassId: string;
  let studentId: string;

  beforeAll(async () => {
    const app = await createTestingApp([EnrollmentsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(SchoolClassEnrollmentsService);

    orgRepo = dataSource.getRepository(Organization);
    gradeLevelRepo = dataSource.getRepository(GradeLevel);
    schoolClassRepo = dataSource.getRepository(SchoolClass);
    studentRepo = dataSource.getRepository(Student);
    enrollmentRepo = dataSource.getRepository(SchoolClassEnrollment);
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

    // "Unterstufe" with subgroups US1/US2 — the shape the kanban works on.
    const mainStage = await gradeLevelRepo.save(
      gradeLevelRepo.create({
        name: 'Unterstufe',
        organizationId: orgId,
        sortOrder: 0,
      }),
    );
    mainStageId = mainStage.id;
    const us1 = await gradeLevelRepo.save(
      gradeLevelRepo.create({
        name: 'US1',
        organizationId: orgId,
        sortOrder: 0,
        parentId: mainStageId,
      }),
    );
    us1Id = us1.id;
    const us2 = await gradeLevelRepo.save(
      gradeLevelRepo.create({
        name: 'US2',
        organizationId: orgId,
        sortOrder: 1,
        parentId: mainStageId,
      }),
    );
    us2Id = us2.id;

    // The class carries only the main stage, as it does in practice.
    const schoolClass = await schoolClassRepo.save(
      schoolClassRepo.create({
        name: 'Klasse PA',
        organizationId: orgId,
        sortOrder: 0,
        gradeLevels: [mainStage],
      }),
    );
    schoolClassId = schoolClass.id;

    const student = await studentRepo.save(
      studentRepo.create({
        firstName: 'Mia',
        lastName: 'Keller',
        organizationId: orgId,
      }),
    );
    studentId = student.id;
  });

  describe('assigning a subgroup', () => {
    it('stores the subgroup on the enrolment', async () => {
      const enrolment = await service.transferStudent(
        { studentId, targetSchoolClassId: schoolClassId, gradeLevelId: us1Id },
        orgId,
      );

      expect(enrolment?.schoolClassId).toBe(schoolClassId);
      expect(enrolment?.gradeLevelId).toBe(us1Id);
    });

    it('accepts the class stage itself, not just its children', async () => {
      const enrolment = await service.transferStudent(
        {
          studentId,
          targetSchoolClassId: schoolClassId,
          gradeLevelId: mainStageId,
        },
        orgId,
      );

      expect(enrolment?.gradeLevelId).toBe(mainStageId);
    });

    it('places the child without a subgroup when none is given', async () => {
      const enrolment = await service.transferStudent(
        { studentId, targetSchoolClassId: schoolClassId },
        orgId,
      );

      expect(enrolment?.gradeLevelId).toBeNull();
    });
  });

  describe('moving within the same class', () => {
    it('updates the subgroup without splitting the enrolment', async () => {
      await service.transferStudent(
        { studentId, targetSchoolClassId: schoolClassId, gradeLevelId: us1Id },
        orgId,
      );

      const moved = await service.transferStudent(
        { studentId, targetSchoolClassId: schoolClassId, gradeLevelId: us2Id },
        orgId,
      );

      expect(moved?.gradeLevelId).toBe(us2Id);
      // One row, still open: moving between subgroups is not a class change.
      const all = await enrollmentRepo.find({ where: { studentId } });
      expect(all).toHaveLength(1);
      expect(all[0].leftAt).toBeNull();
    });

    it('clears the subgroup when null is passed', async () => {
      await service.transferStudent(
        { studentId, targetSchoolClassId: schoolClassId, gradeLevelId: us1Id },
        orgId,
      );

      const moved = await service.transferStudent(
        {
          studentId,
          targetSchoolClassId: schoolClassId,
          gradeLevelId: null,
        },
        orgId,
      );

      expect(moved?.gradeLevelId).toBeNull();
      expect(await enrollmentRepo.count({ where: { studentId } })).toBe(1);
    });

    it('keeps the subgroup when the drop carries no grade level', async () => {
      await service.transferStudent(
        { studentId, targetSchoolClassId: schoolClassId, gradeLevelId: us1Id },
        orgId,
      );

      // A caller that does not know about subgroups must not wipe one.
      const moved = await service.transferStudent(
        { studentId, targetSchoolClassId: schoolClassId },
        orgId,
      );

      expect(moved?.gradeLevelId).toBe(us1Id);
    });
  });

  describe('rejects a mismatched subgroup', () => {
    it('refuses a stage the class does not carry', async () => {
      const foreignStage = await gradeLevelRepo.save(
        gradeLevelRepo.create({
          name: 'Mittelstufe',
          organizationId: orgId,
          sortOrder: 1,
        }),
      );

      await expect(
        service.transferStudent(
          {
            studentId,
            targetSchoolClassId: schoolClassId,
            gradeLevelId: foreignStage.id,
          },
          orgId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses a stage of another organization', async () => {
      const other = await orgRepo.save(
        orgRepo.create({ name: 'Fremd', subdomain: `f${Date.now()}` }),
      );
      const foreign = await gradeLevelRepo.save(
        gradeLevelRepo.create({
          name: 'Fremde Stufe',
          organizationId: other.id,
          sortOrder: 0,
        }),
      );

      await expect(
        service.transferStudent(
          {
            studentId,
            targetSchoolClassId: schoolClassId,
            gradeLevelId: foreign.id,
          },
          orgId,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses a subgroup without a class', async () => {
      await expect(
        service.transferStudent(
          { studentId, targetSchoolClassId: null, gradeLevelId: us1Id },
          orgId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('changing class', () => {
    it('starts a new enrolment and leaves the old one closed', async () => {
      await service.transferStudent(
        { studentId, targetSchoolClassId: schoolClassId, gradeLevelId: us1Id },
        orgId,
      );

      const otherClass = await schoolClassRepo.save(
        schoolClassRepo.create({
          name: 'Klasse PB',
          organizationId: orgId,
          sortOrder: 1,
          gradeLevels: [await gradeLevelRepo.findOneByOrFail({ id: us2Id })],
        }),
      );

      const moved = await service.transferStudent(
        {
          studentId,
          targetSchoolClassId: otherClass.id,
          gradeLevelId: us2Id,
        },
        orgId,
      );

      expect(moved?.schoolClassId).toBe(otherClass.id);
      expect(moved?.gradeLevelId).toBe(us2Id);

      const all = await enrollmentRepo.find({
        where: { studentId },
        order: { enrolledAt: 'ASC' },
      });
      expect(all).toHaveLength(2);
      // The old row keeps its subgroup — that is the history.
      const closed = all.find((e) => e.leftAt !== null);
      expect(closed?.gradeLevelId).toBe(us1Id);
    });
  });
});
