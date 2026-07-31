import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { SchoolClassTeacher } from './entities/school-class-teacher.entity';
import { SchoolClassTeacherRole } from '@/database/enums/school-class-teacher-role.enum';
import { SchoolClassTeacherInput } from './dto/school-class-teacher.input';
import {
  today,
  addDays,
  isInForceOn,
  schoolYearFor,
  SchoolYearRange,
} from './lib/school-year';
import { Organization } from '@/organizations/entities/organization.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Persona } from '@/common/enums/persona.enum';
import { CreateSchoolClassInput } from './dto/create-school-class.input';
import { UpdateSchoolClassInput } from './dto/update-school-class.input';
import { ReorderSchoolClassesInput } from './dto/reorder-school-classes.input';

@Injectable()
export class SchoolClassesService {
  constructor(
    @InjectRepository(SchoolClass)
    private readonly schoolClassRepo: Repository<SchoolClass>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(SchoolClassTeacher)
    private readonly teacherAssignmentRepo: Repository<SchoolClassTeacher>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ) {}

  private async resolveTeachers(
    teacherIds: string[],
    organizationId: string,
  ): Promise<Employee[]> {
    if (!teacherIds.length) return [];
    return this.employeeRepo.find({
      where: {
        id: In(teacherIds),
        membership: {
          organizationId,
          persona: Persona.TEACHER,
        },
      },
      relations: { membership: true },
    });
  }

  /**
   * Mirrors the assignments onto the flat `teachers` list.
   *
   * `teachers` is no longer a mapped relation (see SchoolClass), so nothing
   * fills it automatically. Only assignments in force today are listed, which
   * matches what the old @ManyToMany returned — it had no notion of validity.
   */
  private hydrateTeachers(
    classes: SchoolClass[],
    asOf: string = today(),
  ): SchoolClass[] {
    for (const schoolClass of classes) {
      const inForce = (schoolClass.teacherAssignments ?? []).filter((a) =>
        isInForceOn(a, asOf),
      );
      // LEAD first, so a UI that shows only the first name shows a class
      // teacher rather than an assistant.
      inForce.sort((a, b) =>
        a.role === b.role ? 0 : a.role === SchoolClassTeacherRole.LEAD ? -1 : 1,
      );
      schoolClass.teacherAssignments = inForce;
      schoolClass.teachers = inForce.map((a) => a.employee).filter(Boolean);
    }
    return classes;
  }

  /**
   * Replaces the open assignments of a class with exactly `wanted`.
   *
   * Three cases, and the difference between them is what keeps the history
   * usable:
   * - gone  → closed as of today, never deleted, so past class lists still
   *           resolve
   * - new   → opened from today (or an explicit `validFrom` when backdating)
   * - kept  → only touched if role or workload actually changed, so an
   *           unrelated edit to the class does not reset a start date
   */
  private async syncTeacherAssignments(
    schoolClassId: string,
    wanted: SchoolClassTeacherInput[],
    organizationId: string,
  ): Promise<void> {
    // Re-resolve against the org so a caller cannot attach an employee from
    // another tenant by guessing an id.
    const allowed = await this.resolveTeachers(
      wanted.map((w) => w.employeeId),
      organizationId,
    );
    const allowedIds = new Set(allowed.map((e) => e.id));
    const requested = wanted.filter((w) => allowedIds.has(w.employeeId));
    const requestedById = new Map(requested.map((w) => [w.employeeId, w]));

    const existing = await this.teacherAssignmentRepo.find({
      where: { schoolClassId, organizationId, validTo: IsNull() },
    });
    const now = today();

    const removed = existing.filter((a) => !requestedById.has(a.employeeId));

    // validTo is the LAST day an assignment counts (that is what the CHECK
    // constraint encodes), so removing someone today makes yesterday their
    // last day. Setting it to today would leave them in the class until
    // midnight — the bug an integration test caught after the mocks had all
    // passed.
    const toClose = removed.filter((a) => a.validFrom < now);
    if (toClose.length) {
      await this.teacherAssignmentRepo.update(
        { id: In(toClose.map((a) => a.id)) },
        { validTo: addDays(now, -1) },
      );
    }

    // An assignment added and removed on the same day never applied to a
    // single school day. Closing it is impossible without violating
    // valid_to >= valid_from, and keeping it would clutter the history with a
    // correction rather than a fact — so it is dropped.
    const toDelete = removed.filter((a) => a.validFrom >= now);
    if (toDelete.length) {
      await this.teacherAssignmentRepo.delete({
        id: In(toDelete.map((a) => a.id)),
      });
    }

    const existingByEmployee = new Map(existing.map((a) => [a.employeeId, a]));
    const toSave: SchoolClassTeacher[] = [];

    for (const w of requested) {
      const role = w.role ?? SchoolClassTeacherRole.LEAD;
      const workloadPercent = w.workloadPercent ?? null;
      const current = existingByEmployee.get(w.employeeId);

      if (!current) {
        toSave.push(
          this.teacherAssignmentRepo.create({
            schoolClassId,
            employeeId: w.employeeId,
            organizationId,
            role,
            workloadPercent,
            validFrom: w.validFrom ?? now,
          }),
        );
        continue;
      }

      // Untouched unless something actually changed, so an unrelated edit to
      // the class does not bump the row.
      if (
        current.role !== role ||
        (current.workloadPercent ?? null) !== workloadPercent
      ) {
        current.role = role;
        current.workloadPercent = workloadPercent;
        toSave.push(current);
      }
    }

    if (toSave.length) {
      await this.teacherAssignmentRepo.save(toSave);
    }
  }

  /** Normalises the two input shapes into one. `teachers` wins when both are sent. */
  private toAssignmentInputs(
    teacherIds?: string[],
    teachers?: SchoolClassTeacherInput[],
  ): SchoolClassTeacherInput[] | undefined {
    if (teachers !== undefined) return teachers;
    if (teacherIds !== undefined) {
      return teacherIds.map((employeeId) => ({
        employeeId,
        role: SchoolClassTeacherRole.LEAD,
      }));
    }
    return undefined;
  }

  /**
   * Full assignment history of a class, newest first.
   *
   * Unlike the `teacherAssignments` on a class, this deliberately includes
   * closed ones — it is what a "who taught this class, and when" view needs.
   */
  async findTeacherHistory(
    schoolClassId: string,
    organizationId: string,
  ): Promise<SchoolClassTeacher[]> {
    // Fails if the class belongs to another org, so the history cannot be
    // used to probe for foreign class ids.
    await this.findOne(schoolClassId, organizationId);

    return this.teacherAssignmentRepo.find({
      where: { schoolClassId, organizationId },
      relations: { employee: { membership: { user: true } } },
      order: { validFrom: 'DESC', role: 'ASC' },
    });
  }

  /** The org's school year containing `date` (today when omitted). */
  async schoolYearOf(
    organizationId: string,
    date?: string,
  ): Promise<SchoolYearRange> {
    const org = await this.organizationRepo.findOne({
      where: { id: organizationId },
      select: {
        id: true,
        schoolYearStartMonth: true,
        schoolYearStartDay: true,
      },
    });
    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }
    return schoolYearFor(date ?? today(), org);
  }

  async create(
    input: CreateSchoolClassInput,
    organizationId: string,
  ): Promise<SchoolClass> {
    const { gradeLevelIds, teacherIds, teachers, ...rest } = input;
    // Ordering is drag-and-drop only (no form field) — append new classes.
    if (rest.sortOrder === undefined) {
      const max = await this.schoolClassRepo.maximum('sortOrder', {
        organizationId,
      });
      rest.sortOrder = (max ?? -1) + 1;
    }
    const schoolClass = this.schoolClassRepo.create({
      ...rest,
      organizationId,
    });

    if (gradeLevelIds?.length) {
      schoolClass.gradeLevels = await this.gradeLevelRepo.findBy({
        id: In(gradeLevelIds),
        organizationId,
      });
    }

    const saved = await this.schoolClassRepo.save(schoolClass);

    const assignments = this.toAssignmentInputs(teacherIds, teachers);
    if (assignments?.length) {
      await this.syncTeacherAssignments(saved.id, assignments, organizationId);
    }

    return this.findOne(saved.id, organizationId);
  }

  /**
   * @param asOf Resolve teacher assignments as they stood on this date —
   *   how a class list looked in a past school year. Defaults to today.
   */
  async findAllByOrgId(
    organizationId: string,
    asOf?: string,
  ): Promise<SchoolClass[]> {
    const classes = await this.schoolClassRepo.find({
      where: { organizationId, isActive: true },
      relations: {
        gradeLevels: true,
        teacherAssignments: { employee: { membership: { user: true } } },
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    if (classes.length === 0) return classes;
    this.hydrateTeachers(classes, asOf);

    const rows: Array<{ class_id: string; enrolled_count: string }> =
      await this.schoolClassRepo
        .createQueryBuilder('sc')
        .innerJoin(
          'school_class_enrollments',
          'e',
          'e.school_class_id = sc.id AND e.left_at IS NULL AND e."isActive" = true',
        )
        .select('sc.id', 'class_id')
        .addSelect('COUNT(DISTINCT e.student_id)', 'enrolled_count')
        .where('sc.organizationId = :organizationId', { organizationId })
        .andWhere('sc.id IN (:...ids)', { ids: classes.map((c) => c.id) })
        .groupBy('sc.id')
        .getRawMany();

    const counts = new Map(
      rows.map((r) => [r.class_id, Number(r.enrolled_count)]),
    );
    return classes.map((schoolClass) => {
      schoolClass.enrolledCount = counts.get(schoolClass.id) ?? 0;
      return schoolClass;
    });
  }

  /**
   * Klassen, die der aufrufende User unterrichtet (oder alle, wenn
   * Admin/SuperAdmin). Gleiche Sichtbarkeits-Regel wie
   * `StudentsService.assertSchoolClassVisibleToUser`, damit die
   * Klassen-Heatmap-Auswahl im Frontend nur Klassen anzeigt, auf die
   * der Lehrer auch wirklich Zugriff hat.
   */
  async findVisibleToUser(
    organizationId: string,
    userId: string,
    roles: string[],
    isSuperAdmin: boolean,
  ): Promise<SchoolClass[]> {
    const ADMIN_ROLES = new Set([
      'ORG_OWNER',
      'ORG_ADMIN',
      'HR_MANAGER',
      'OFFICE',
    ]);
    const isAdmin =
      isSuperAdmin || (roles ?? []).some((r) => ADMIN_ROLES.has(r));
    if (isAdmin) {
      return this.findAllByOrgId(organizationId);
    }
    // Teacher (or any non-admin role): only return classes where they
    // are assigned via `school_class_teachers`.
    const visible = await this.schoolClassRepo
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.gradeLevels', 'gradeLevels')
      .leftJoinAndSelect('sc.teacherAssignments', 'assignments')
      .leftJoinAndSelect('assignments.employee', 'teachers')
      .leftJoinAndSelect('teachers.membership', 'tm')
      .leftJoinAndSelect('tm.user', 'tu')
      .innerJoin(
        'school_class_teachers',
        'sct_user',
        'sct_user.school_class_id = sc.id AND sct_user.valid_to IS NULL',
      )
      .innerJoin(
        'memberships',
        'm_user',
        'm_user.employee_id = sct_user.employee_id',
      )
      .where('sc.organization_id = :orgId', { orgId: organizationId })
      .andWhere('sc."isActive" = true')
      .andWhere('m_user.user_id = :uid', { uid: userId })
      .andWhere('m_user.organization_id = :orgId', { orgId: organizationId })
      .andWhere('m_user."isActive" = true')
      .orderBy('sc."sortOrder"', 'ASC')
      .addOrderBy('sc.name', 'ASC')
      .getMany();
    return this.hydrateTeachers(visible);
  }

  async findOne(
    id: string,
    organizationId: string,
    asOf?: string,
  ): Promise<SchoolClass> {
    const schoolClass = await this.schoolClassRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: {
        gradeLevels: true,
        teacherAssignments: { employee: { membership: { user: true } } },
      },
    });
    if (!schoolClass) {
      throw new NotFoundException(`SchoolClass ${id} not found`);
    }
    // findAllByOrgId computes this for the grid; the detail view needs it too,
    // otherwise the class summary shows an empty student count.
    schoolClass.enrolledCount = await this.countEnrolled(id, organizationId);
    return this.hydrateTeachers([schoolClass], asOf)[0];
  }

  /** Students currently enrolled in the class (not yet left). */
  private async countEnrolled(
    schoolClassId: string,
    organizationId: string,
  ): Promise<number> {
    const row = await this.schoolClassRepo
      .createQueryBuilder('sc')
      .innerJoin(
        'school_class_enrollments',
        'e',
        'e.school_class_id = sc.id AND e.left_at IS NULL AND e."isActive" = true',
      )
      .select('COUNT(DISTINCT e.student_id)', 'enrolled_count')
      .where('sc.id = :schoolClassId', { schoolClassId })
      .andWhere('sc.organization_id = :organizationId', { organizationId })
      .getRawOne<{ enrolled_count: string }>();
    return Number(row?.enrolled_count ?? 0);
  }

  async update(
    input: UpdateSchoolClassInput,
    organizationId: string,
  ): Promise<SchoolClass> {
    const { gradeLevelIds, teacherIds, teachers, ...rest } = input;
    const schoolClass = await this.findOne(input.id, organizationId);
    Object.assign(schoolClass, rest);

    if (gradeLevelIds !== undefined) {
      schoolClass.gradeLevels = gradeLevelIds.length
        ? await this.gradeLevelRepo.findBy({
            id: In(gradeLevelIds),
            organizationId,
          })
        : [];
    }

    const assignments = this.toAssignmentInputs(teacherIds, teachers);
    if (assignments !== undefined) {
      await this.syncTeacherAssignments(
        schoolClass.id,
        assignments,
        organizationId,
      );
    }

    // Saving the entity would cascade over the relations it was loaded with,
    // and `teacherAssignments` is a filtered view by then (hydrateTeachers
    // keeps only what is in force today). TypeORM reads the missing rows as
    // "detached" and nulls their school_class_id, which the NOT NULL
    // constraint rejects. The assignments were already written above, so the
    // class row is updated on its own columns only.
    delete schoolClass.teacherAssignments;
    delete schoolClass.teachers;
    await this.schoolClassRepo.save(schoolClass);
    return this.findOne(schoolClass.id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const schoolClass = await this.findOne(id, organizationId);
    schoolClass.isActive = false;
    await this.schoolClassRepo.save(schoolClass);
    return true;
  }

  async reorder(
    input: ReorderSchoolClassesInput,
    organizationId: string,
  ): Promise<SchoolClass[]> {
    const classes = await this.schoolClassRepo.find({
      where: { id: In(input.ids), organizationId, isActive: true },
    });
    if (classes.length !== input.ids.length) {
      throw new NotFoundException(
        'One or more school classes not found in this organization',
      );
    }
    const byId = new Map(classes.map((c) => [c.id, c]));
    const toSave = input.ids.map((id, index) => {
      const schoolClass = byId.get(id)!;
      schoolClass.sortOrder = index;
      return schoolClass;
    });
    await this.schoolClassRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }
}
