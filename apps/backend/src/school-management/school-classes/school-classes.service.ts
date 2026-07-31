import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { SchoolClassTeacher } from './entities/school-class-teacher.entity';
import { SchoolClassTeacherRole } from '@/database/enums/school-class-teacher-role.enum';
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
  private hydrateTeachers(classes: SchoolClass[]): SchoolClass[] {
    const today = new Date().toISOString().slice(0, 10);
    for (const schoolClass of classes) {
      schoolClass.teachers = (schoolClass.teacherAssignments ?? [])
        .filter(
          (a) => a.validFrom <= today && (!a.validTo || a.validTo >= today),
        )
        .map((a) => a.employee)
        .filter(Boolean);
    }
    return classes;
  }

  /**
   * Replaces the open assignments of a class with exactly `teacherIds`.
   *
   * Assignments that stay are left untouched so their role, workload and start
   * date survive an unrelated edit; removed ones are closed rather than deleted,
   * which is what keeps historical class lists intact.
   */
  private async syncTeacherAssignments(
    schoolClassId: string,
    teacherIds: string[],
    organizationId: string,
  ): Promise<void> {
    const teachers = await this.resolveTeachers(teacherIds, organizationId);
    const wanted = new Set(teachers.map((t) => t.id));

    const existing = await this.teacherAssignmentRepo.find({
      where: { schoolClassId, organizationId, validTo: IsNull() },
    });

    const today = new Date().toISOString().slice(0, 10);
    const toClose = existing.filter((a) => !wanted.has(a.employeeId));
    if (toClose.length) {
      await this.teacherAssignmentRepo.update(
        { id: In(toClose.map((a) => a.id)) },
        { validTo: today },
      );
    }

    const known = new Set(existing.map((a) => a.employeeId));
    const toAdd = teachers.filter((t) => !known.has(t.id));
    if (toAdd.length) {
      await this.teacherAssignmentRepo.save(
        toAdd.map((t) =>
          this.teacherAssignmentRepo.create({
            schoolClassId,
            employeeId: t.id,
            organizationId,
            role: SchoolClassTeacherRole.LEAD,
            validFrom: today,
          }),
        ),
      );
    }
  }

  async create(
    input: CreateSchoolClassInput,
    organizationId: string,
  ): Promise<SchoolClass> {
    const { gradeLevelIds, teacherIds, ...rest } = input;
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

    if (teacherIds?.length) {
      await this.syncTeacherAssignments(saved.id, teacherIds, organizationId);
    }

    return this.findOne(saved.id, organizationId);
  }

  async findAllByOrgId(organizationId: string): Promise<SchoolClass[]> {
    const classes = await this.schoolClassRepo.find({
      where: { organizationId, isActive: true },
      relations: {
        gradeLevels: true,
        teacherAssignments: { employee: { membership: { user: true } } },
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    if (classes.length === 0) return classes;
    this.hydrateTeachers(classes);

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

  async findOne(id: string, organizationId: string): Promise<SchoolClass> {
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
    return this.hydrateTeachers([schoolClass])[0];
  }

  async update(
    input: UpdateSchoolClassInput,
    organizationId: string,
  ): Promise<SchoolClass> {
    const { gradeLevelIds, teacherIds, ...rest } = input;
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

    if (teacherIds !== undefined) {
      await this.syncTeacherAssignments(
        schoolClass.id,
        teacherIds,
        organizationId,
      );
    }

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
