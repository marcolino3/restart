import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SchoolClass } from './entities/school-class.entity';
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

    if (teacherIds?.length) {
      schoolClass.teachers = await this.resolveTeachers(
        teacherIds,
        organizationId,
      );
    }

    return this.schoolClassRepo.save(schoolClass);
  }

  async findAllByOrgId(organizationId: string): Promise<SchoolClass[]> {
    const classes = await this.schoolClassRepo.find({
      where: { organizationId, isActive: true },
      relations: {
        gradeLevels: true,
        teachers: { membership: { user: true } },
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    if (classes.length === 0) return classes;

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
    return this.schoolClassRepo
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.gradeLevels', 'gradeLevels')
      .leftJoinAndSelect('sc.teachers', 'teachers')
      .leftJoinAndSelect('teachers.membership', 'tm')
      .leftJoinAndSelect('tm.user', 'tu')
      .innerJoin(
        'school_class_teachers',
        'sct_user',
        'sct_user.school_class_id = sc.id',
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
  }

  async findOne(id: string, organizationId: string): Promise<SchoolClass> {
    const schoolClass = await this.schoolClassRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: {
        gradeLevels: true,
        teachers: { membership: { user: true } },
      },
    });
    if (!schoolClass) {
      throw new NotFoundException(`SchoolClass ${id} not found`);
    }
    return schoolClass;
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
      schoolClass.teachers = await this.resolveTeachers(
        teacherIds,
        organizationId,
      );
    }

    return this.schoolClassRepo.save(schoolClass);
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
