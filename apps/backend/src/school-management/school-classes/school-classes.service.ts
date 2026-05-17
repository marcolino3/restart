import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Persona } from '@/common/enums/persona.enum';
import { CreateSchoolClassInput } from './dto/create-school-class.input';
import { UpdateSchoolClassInput } from './dto/update-school-class.input';

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
    return this.schoolClassRepo.find({
      where: { organizationId, isActive: true },
      relations: {
        gradeLevels: true,
        teachers: { membership: { user: true } },
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
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
}
