/**
 * Integration test for teacher row-level scoping on students (Scope 2).
 *
 * Regression coverage for the access-control gap where a TEACHER persona
 * could see/access students outside their own assigned class(es) — the
 * row-level filter in StudentsService.findVisibleByUser /
 * assertStudentVisibleToUser must join through
 * school_class_enrollments -> school_class_teachers -> memberships and
 * respect validity windows (valid_to / left_at).
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=students-teacher-scoping
 */
import { DataSource, Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { StudentsService } from '@/school-management/students/students.service';
import { Student } from '@/school-management/students/entities/student.entity';
import { AdmissionStage } from '@/school-management/admission-stages/entities/admission-stage.entity';
import { AdmissionStagesService } from '@/school-management/admission-stages/admission-stages.service';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { SchoolClassTeacher } from '@/school-management/school-classes/entities/school-class-teacher.entity';
import { SchoolClassTeacherRole } from '@/database/enums/school-class-teacher-role.enum';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { User } from '@/users/entities/user.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Persona } from '@/common/enums/persona.enum';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [TypeOrmModule.forFeature([Student, AdmissionStage, Organization])],
  providers: [StudentsService, AdmissionStagesService],
})
class StudentsTestModule {}

describe('StudentsService teacher row-level scoping (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: StudentsService;

  let orgRepo: Repository<Organization>;
  let userRepo: Repository<User>;
  let membershipRepo: Repository<Membership>;
  let employeeRepo: Repository<Employee>;
  let studentRepo: Repository<Student>;
  let classRepo: Repository<SchoolClass>;
  let assignmentRepo: Repository<SchoolClassTeacher>;
  let enrollmentRepo: Repository<SchoolClassEnrollment>;

  let orgId: string;

  /** Creates a user + employee with a TEACHER membership in the given org. */
  const createTeacherUser = async (
    firstName: string,
  ): Promise<{ userId: string; employeeId: string }> => {
    const user = await userRepo.save(
      userRepo.create({ firstName, lastName: 'Test' }),
    );
    const employee = await employeeRepo.save(employeeRepo.create({}));
    await membershipRepo.save(
      membershipRepo.create({
        organizationId: orgId,
        userId: user.id,
        employeeId: employee.id,
        persona: Persona.TEACHER,
      }),
    );
    return { userId: user.id, employeeId: employee.id };
  };

  const createClass = (name: string) =>
    classRepo.save(classRepo.create({ name, organizationId: orgId }));

  const assignTeacher = (
    schoolClassId: string,
    employeeId: string,
    validTo: string | null = null,
  ) =>
    assignmentRepo.save(
      assignmentRepo.create({
        schoolClassId,
        employeeId,
        organizationId: orgId,
        role: SchoolClassTeacherRole.LEAD,
        validFrom: '2025-08-01',
        validTo,
      }),
    );

  const createStudent = (firstName: string) =>
    studentRepo.save(
      studentRepo.create({
        firstName,
        lastName: 'Kind',
        organizationId: orgId,
      }),
    );

  const enrollStudent = (
    studentId: string,
    schoolClassId: string,
    leftAt: string | null = null,
  ) =>
    enrollmentRepo.save(
      enrollmentRepo.create({
        studentId,
        schoolClassId,
        organizationId: orgId,
        enrolledAt: '2025-08-01',
        leftAt,
      }),
    );

  beforeAll(async () => {
    const app = await createTestingApp([StudentsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(StudentsService);

    orgRepo = dataSource.getRepository(Organization);
    userRepo = dataSource.getRepository(User);
    membershipRepo = dataSource.getRepository(Membership);
    employeeRepo = dataSource.getRepository(Employee);
    studentRepo = dataSource.getRepository(Student);
    classRepo = dataSource.getRepository(SchoolClass);
    assignmentRepo = dataSource.getRepository(SchoolClassTeacher);
    enrollmentRepo = dataSource.getRepository(SchoolClassEnrollment);
  }, 30000);

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
  });

  it('shows a teacher only the students of their own class', async () => {
    const { userId, employeeId } = await createTeacherUser('Anna');
    const classA = await createClass('Klasse A');
    const classB = await createClass('Klasse B');
    await assignTeacher(classA.id, employeeId);

    const ownStudent = await createStudent('Eigenes');
    const otherStudent = await createStudent('Fremdes');
    await enrollStudent(ownStudent.id, classA.id);
    await enrollStudent(otherStudent.id, classB.id);

    const visible = await service.findVisibleByUser(
      userId,
      ['TEACHER'],
      false,
      orgId,
    );

    expect(visible.map((s) => s.id)).toEqual([ownStudent.id]);
  });

  it('excludes a student whose enrollment has ended (left_at set)', async () => {
    const { userId, employeeId } = await createTeacherUser('Anna');
    const classA = await createClass('Klasse A');
    await assignTeacher(classA.id, employeeId);

    const leftStudent = await createStudent('Ausgetreten');
    await enrollStudent(leftStudent.id, classA.id, '2025-12-01');

    const visible = await service.findVisibleByUser(
      userId,
      ['TEACHER'],
      false,
      orgId,
    );

    expect(visible).toHaveLength(0);
  });

  it('excludes students of a class the teacher was reassigned away from (valid_to set)', async () => {
    const { userId, employeeId } = await createTeacherUser('Anna');
    const classA = await createClass('Klasse A');
    await assignTeacher(classA.id, employeeId, '2025-12-01');

    const student = await createStudent('Kind');
    await enrollStudent(student.id, classA.id);

    const visible = await service.findVisibleByUser(
      userId,
      ['TEACHER'],
      false,
      orgId,
    );

    expect(visible).toHaveLength(0);
  });

  it('gives an admin persona visibility over every student in the org', async () => {
    const { userId } = await createTeacherUser('Admin-ish');
    const classA = await createClass('Klasse A');
    const student = await createStudent('Kind');
    await enrollStudent(student.id, classA.id);

    const visible = await service.findVisibleByUser(
      userId,
      ['ORG_ADMIN'],
      false,
      orgId,
    );

    expect(visible.map((s) => s.id)).toEqual([student.id]);
  });

  it('assertStudentVisibleToUser rejects a teacher probing a foreign-class studentId', async () => {
    const { userId, employeeId } = await createTeacherUser('Anna');
    const classA = await createClass('Klasse A');
    const classB = await createClass('Klasse B');
    await assignTeacher(classA.id, employeeId);

    const foreignStudent = await createStudent('Fremdes');
    await enrollStudent(foreignStudent.id, classB.id);

    await expect(
      service.assertStudentVisibleToUser(
        foreignStudent.id,
        userId,
        ['TEACHER'],
        false,
        orgId,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('assertStudentVisibleToUser allows a teacher access to their own class student', async () => {
    const { userId, employeeId } = await createTeacherUser('Anna');
    const classA = await createClass('Klasse A');
    await assignTeacher(classA.id, employeeId);

    const student = await createStudent('Eigenes');
    await enrollStudent(student.id, classA.id);

    await expect(
      service.assertStudentVisibleToUser(
        student.id,
        userId,
        ['TEACHER'],
        false,
        orgId,
      ),
    ).resolves.toBeUndefined();
  });
});
