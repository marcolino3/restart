/**
 * Integration test for school classes against a real PostgreSQL database.
 *
 * Covers what the mock-based unit tests cannot: that the entities actually
 * match the columns in the database, that the teacher-assignment history
 * behaves under real constraints, and that another organisation's data stays
 * out of reach.
 *
 * The unit suite passes a repository mock, and a mock always has whatever
 * property the object was given — a column missing in the database is
 * invisible there. That is exactly how a missing set of AbstractEntity
 * columns on school_class_teachers reached a running environment: every
 * query on the table failed with "column SchoolClassTeacher.version does not
 * exist", and nothing in the test suite touched a real table.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=school-classes
 */
import { DataSource, Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { SchoolClassesService } from '@/school-management/school-classes/school-classes.service';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { SchoolClassTeacher } from '@/school-management/school-classes/entities/school-class-teacher.entity';
import { SchoolClassTeacherRole } from '@/database/enums/school-class-teacher-role.enum';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { User } from '@/users/entities/user.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Persona } from '@/common/enums/persona.enum';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolClass,
      SchoolClassTeacher,
      GradeLevel,
      Employee,
      Organization,
    ]),
  ],
  providers: [SchoolClassesService],
})
class SchoolClassesTestModule {}

describe('SchoolClasses service (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: SchoolClassesService;

  let orgRepo: Repository<Organization>;
  let userRepo: Repository<User>;
  let membershipRepo: Repository<Membership>;
  let employeeRepo: Repository<Employee>;
  let assignmentRepo: Repository<SchoolClassTeacher>;

  let orgId: string;
  let otherOrgId: string;
  let teacherA: string;
  let teacherB: string;
  let foreignTeacher: string;

  /** Creates an employee with a TEACHER membership in the given org. */
  const createTeacher = async (
    organizationId: string,
    firstName: string,
  ): Promise<string> => {
    const user = await userRepo.save(
      userRepo.create({ firstName, lastName: 'Test' }),
    );
    const employee = await employeeRepo.save(employeeRepo.create({}));
    await membershipRepo.save(
      membershipRepo.create({
        organizationId,
        userId: user.id,
        employeeId: employee.id,
        persona: Persona.TEACHER,
      }),
    );
    return employee.id;
  };

  beforeAll(async () => {
    const app = await createTestingApp([SchoolClassesTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(SchoolClassesService);

    orgRepo = dataSource.getRepository(Organization);
    userRepo = dataSource.getRepository(User);
    membershipRepo = dataSource.getRepository(Membership);
    employeeRepo = dataSource.getRepository(Employee);
    assignmentRepo = dataSource.getRepository(SchoolClassTeacher);
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
    const other = await orgRepo.save(
      orgRepo.create({ name: 'Fremdschule', subdomain: `f${Date.now()}` }),
    );
    otherOrgId = other.id;

    teacherA = await createTeacher(orgId, 'Anna');
    teacherB = await createTeacher(orgId, 'Lea');
    foreignTeacher = await createTeacher(otherOrgId, 'Fremd');
  });

  describe('create', () => {
    it('persists a class with teachers, roles and workloads', async () => {
      // The regression case: this whole path failed against a real database
      // while every mock-based test passed.
      const created = await service.create(
        {
          name: 'Primaria A',
          shortCode: 'PRA',
          teachers: [
            {
              employeeId: teacherA,
              role: SchoolClassTeacherRole.LEAD,
              workloadPercent: 80,
            },
            {
              employeeId: teacherB,
              role: SchoolClassTeacherRole.ASSISTANT,
              workloadPercent: 50,
            },
          ],
        },
        orgId,
      );

      expect(created.name).toBe('Primaria A');
      expect(created.shortCode).toBe('PRA');

      const stored = await assignmentRepo.find({
        where: { schoolClassId: created.id },
        order: { role: 'ASC' },
      });
      expect(stored).toHaveLength(2);
      expect(stored.map((a) => a.role).sort()).toEqual(['ASSISTANT', 'LEAD']);
      expect(stored.every((a) => a.organizationId === orgId)).toBe(true);
      // Open-ended: an assignment runs until it is explicitly closed.
      expect(stored.every((a) => a.validTo === null)).toBe(true);
      // AbstractEntity columns must exist and be populated — their absence is
      // what broke the feature in the first place.
      expect(stored.every((a) => a.version >= 1)).toBe(true);
      expect(stored.every((a) => a.createdAt instanceof Date)).toBe(true);
    });

    it('accepts the plain teacherIds shape and defaults everyone to LEAD', async () => {
      const created = await service.create(
        { name: 'Primaria B', teacherIds: [teacherA] },
        orgId,
      );

      const stored = await assignmentRepo.find({
        where: { schoolClassId: created.id },
      });
      expect(stored).toHaveLength(1);
      expect(stored[0].role).toBe(SchoolClassTeacherRole.LEAD);
      expect(stored[0].workloadPercent).toBeNull();
    });

    it('ignores a teacher belonging to another organization', async () => {
      const created = await service.create(
        {
          name: 'Primaria C',
          teachers: [{ employeeId: foreignTeacher }],
        },
        orgId,
      );

      const stored = await assignmentRepo.find({
        where: { schoolClassId: created.id },
      });
      expect(stored).toHaveLength(0);
    });
  });

  describe('read', () => {
    it('loads the class with its teachers and the enrolled count', async () => {
      const created = await service.create(
        {
          name: 'Primaria A',
          teachers: [{ employeeId: teacherA, workloadPercent: 60 }],
        },
        orgId,
      );

      const loaded = await service.findOne(created.id, orgId);
      expect(loaded.teachers?.map((t) => t.id)).toEqual([teacherA]);
      expect(loaded.teacherAssignments?.[0].workloadPercent).toBe(60);
      // No enrolments yet, but the field must resolve rather than stay null.
      expect(loaded.enrolledCount).toBe(0);
    });

    it('lists classes of the calling org only (multi-tenant isolation)', async () => {
      await service.create({ name: 'Eigene' }, orgId);
      await service.create({ name: 'Fremde' }, otherOrgId);

      const mine = await service.findAllByOrgId(orgId);
      expect(mine.map((c) => c.name)).toEqual(['Eigene']);
    });

    it('refuses to load a class of another organization', async () => {
      const foreign = await service.create({ name: 'Fremde' }, otherOrgId);

      await expect(service.findOne(foreign.id, orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('closes a removed assignment instead of deleting it', async () => {
      const created = await service.create(
        {
          name: 'Primaria A',
          // Backdated, so removing them today is a real end of service rather
          // than the same-day correction covered by the next test.
          teachers: [
            { employeeId: teacherA, validFrom: '2025-08-01' },
            { employeeId: teacherB, validFrom: '2025-08-01' },
          ],
        },
        orgId,
      );

      await service.update(
        { id: created.id, teachers: [{ employeeId: teacherA }] },
        orgId,
      );

      const all = await assignmentRepo.find({
        where: { schoolClassId: created.id },
      });
      // Both rows survive — the history is what makes past class lists work.
      expect(all).toHaveLength(2);
      const closed = all.find((a) => a.employeeId === teacherB);
      expect(closed?.validTo).not.toBeNull();

      // The flat list only shows who is currently assigned.
      const loaded = await service.findOne(created.id, orgId);
      expect(loaded.teachers?.map((t) => t.id)).toEqual([teacherA]);
    });

    it('changes role and workload without moving the start date', async () => {
      const created = await service.create(
        {
          name: 'Primaria A',
          teachers: [
            {
              employeeId: teacherA,
              role: SchoolClassTeacherRole.LEAD,
              workloadPercent: 60,
              validFrom: '2025-08-01',
            },
          ],
        },
        orgId,
      );

      await service.update(
        {
          id: created.id,
          teachers: [
            {
              employeeId: teacherA,
              role: SchoolClassTeacherRole.ASSISTANT,
              workloadPercent: 40,
            },
          ],
        },
        orgId,
      );

      const [assignment] = await assignmentRepo.find({
        where: { schoolClassId: created.id },
      });
      expect(assignment.role).toBe(SchoolClassTeacherRole.ASSISTANT);
      expect(assignment.workloadPercent).toBe(40);
      // Still the original start — this is a change, not a re-assignment.
      expect(assignment.validFrom).toBe('2025-08-01');
    });

    it('removing every teacher leaves the class without assignments', async () => {
      const created = await service.create(
        {
          name: 'Primaria A',
          teachers: [{ employeeId: teacherA, validFrom: '2025-08-01' }],
        },
        orgId,
      );

      await service.update({ id: created.id, teachers: [] }, orgId);

      const loaded = await service.findOne(created.id, orgId);
      expect(loaded.teachers).toEqual([]);
      // Still on record — the class list for last autumn must keep working.
      const history = await service.findTeacherHistory(created.id, orgId);
      expect(history).toHaveLength(1);
      expect(history[0].validTo).not.toBeNull();
    });

    it('drops an assignment added and removed on the same day', async () => {
      // It never covered a school day, and it cannot be closed without
      // violating valid_to >= valid_from, so it leaves no trace.
      const created = await service.create(
        { name: 'Primaria A', teachers: [{ employeeId: teacherA }] },
        orgId,
      );

      await service.update({ id: created.id, teachers: [] }, orgId);

      const loaded = await service.findOne(created.id, orgId);
      expect(loaded.teachers).toEqual([]);
      const history = await service.findTeacherHistory(created.id, orgId);
      expect(history).toHaveLength(0);
    });

    it('updates the plain fields', async () => {
      const created = await service.create({ name: 'Alt' }, orgId);

      const updated = await service.update(
        { id: created.id, name: 'Neu', shortCode: 'NEU', room: 'Atelier 2' },
        orgId,
      );

      expect(updated.name).toBe('Neu');
      expect(updated.shortCode).toBe('NEU');
      expect(updated.room).toBe('Atelier 2');
    });

    it('refuses to update a class of another organization', async () => {
      const foreign = await service.create({ name: 'Fremde' }, otherOrgId);

      await expect(
        service.update({ id: foreign.id, name: 'Gekapert' }, orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('history', () => {
    it('keeps closed assignments and resolves the class as of a past date', async () => {
      const created = await service.create(
        {
          name: 'Primaria A',
          teachers: [{ employeeId: teacherA, validFrom: '2024-08-01' }],
        },
        orgId,
      );

      // Hand over the class to the other teacher.
      await assignmentRepo.update(
        { schoolClassId: created.id, employeeId: teacherA },
        { validTo: '2025-07-31' },
      );
      await assignmentRepo.save(
        assignmentRepo.create({
          schoolClassId: created.id,
          employeeId: teacherB,
          organizationId: orgId,
          role: SchoolClassTeacherRole.LEAD,
          validFrom: '2025-08-01',
        }),
      );

      const past = await service.findOne(created.id, orgId, '2025-03-01');
      expect(past.teachers?.map((t) => t.id)).toEqual([teacherA]);

      const later = await service.findOne(created.id, orgId, '2026-03-01');
      expect(later.teachers?.map((t) => t.id)).toEqual([teacherB]);

      const history = await service.findTeacherHistory(created.id, orgId);
      expect(history).toHaveLength(2);
    });

    it('refuses the history of a class of another organization', async () => {
      const foreign = await service.create({ name: 'Fremde' }, otherOrgId);

      await expect(
        service.findTeacherHistory(foreign.id, orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // The DB-level constraints (workload range, one open assignment per
  // person) are NOT covered here: this suite builds its schema with
  // synchronize: true, which does not emit CHECK constraints or partial
  // indexes. They are verified against the migrated schema in
  // migrations-match-entities.integration-spec.ts instead.
});
