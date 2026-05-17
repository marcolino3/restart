import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { AdmissionStage } from '../admission-stages/entities/admission-stage.entity';
import { AdmissionStageType } from '../admission-stages/enums/admission-stage-type.enum';
import { AdmissionStagesService } from '../admission-stages/admission-stages.service';
import { Student } from './entities/student.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(AdmissionStage)
    private readonly stagesRepo: Repository<AdmissionStage>,
    private readonly admissionStagesService: AdmissionStagesService,
  ) {}

  async create(
    input: CreateStudentInput,
    organizationId: string,
  ): Promise<Student> {
    let admissionStageId = input.admissionStageId ?? null;
    if (!admissionStageId) {
      const defaultStage =
        await this.admissionStagesService.findDefault(organizationId);
      admissionStageId = defaultStage?.id ?? null;
    }
    const student = this.studentRepo.create({
      ...input,
      admissionStageId,
      organizationId,
    });
    const saved = await this.studentRepo.save(student);
    return this.findOne(saved.id, organizationId);
  }

  async findAllByOrgId(organizationId: string): Promise<Student[]> {
    return this.studentRepo.find({
      where: { organizationId, isActive: true },
      relations: ['admissionStage'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  /**
   * Row-level scope: returns only students the calling user is allowed to see.
   *
   * - SuperAdmin or admin-level roles (ORG_OWNER, ORG_ADMIN, HR_MANAGER, OFFICE):
   *   sees all students of the org (same as findAllByOrgId).
   * - Otherwise (e.g. EMPLOYEE / TEACHER): sees only students who have an
   *   active enrollment (left_at IS NULL) in a school class where the user
   *   is assigned as teacher (via school_class_teachers → employees ←
   *   memberships ← users).
   * - Anyone else with no class assignment: empty list.
   */
  async findVisibleByUser(
    userId: string,
    roles: string[],
    isSuperAdmin: boolean,
    organizationId: string,
  ): Promise<Student[]> {
    const ADMIN_ROLES = new Set([
      'ORG_OWNER',
      'ORG_ADMIN',
      'HR_MANAGER',
      'OFFICE',
    ]);
    const hasAdminRole = roles?.some((r) => ADMIN_ROLES.has(r)) ?? false;
    if (isSuperAdmin || hasAdminRole) {
      return this.findAllByOrgId(organizationId);
    }

    return this.studentRepo
      .createQueryBuilder('s')
      .innerJoin(
        `(
          SELECT DISTINCT e.student_id
          FROM "school_class_enrollments" e
          INNER JOIN "school_class_teachers" sct
            ON sct.school_class_id = e.school_class_id
          INNER JOIN "memberships" m
            ON m.employee_id = sct.employee_id
          WHERE m.user_id = :uid
            AND m.organization_id = :orgId
            AND m."isActive" = true
            AND e.organization_id = :orgId
            AND e."isActive" = true
            AND e.left_at IS NULL
        )`,
        'visible_students',
        'visible_students.student_id = s.id',
      )
      .leftJoinAndSelect('s.admissionStage', 'admissionStage')
      .where('s.organization_id = :orgId', { orgId: organizationId })
      .andWhere('s."isActive" = true')
      .setParameter('uid', userId)
      .orderBy('s."lastName"', 'ASC')
      .addOrderBy('s."firstName"', 'ASC')
      .getMany();
  }

  /**
   * Returns true if the user is in an admin role (or SuperAdmin) and may
   * therefore access every student of the org.
   */
  private isStudentAdminUser(roles: string[], isSuperAdmin: boolean): boolean {
    const ADMIN_ROLES = new Set([
      'ORG_OWNER',
      'ORG_ADMIN',
      'HR_MANAGER',
      'OFFICE',
    ]);
    return isSuperAdmin || (roles?.some((r) => ADMIN_ROLES.has(r)) ?? false);
  }

  /**
   * Throws ForbiddenException unless the calling user is allowed to access
   * the given student under the row-level visibility rules of
   * `findVisibleByUser`. Multi-tenant safety is enforced via the org filter.
   *
   * Use this in any endpoint that takes a `studentId` from the client
   * (studentById, mutations, sub-resources like enrollments / records).
   */
  async assertStudentVisibleToUser(
    studentId: string,
    userId: string,
    roles: string[],
    isSuperAdmin: boolean,
    organizationId: string,
  ): Promise<void> {
    if (this.isStudentAdminUser(roles, isSuperAdmin)) {
      const inOrg = await this.studentRepo.exists({
        where: { id: studentId, organizationId },
      });
      if (!inOrg) {
        throw new NotFoundException(`Student ${studentId} not found`);
      }
      return;
    }

    const row = await this.studentRepo
      .createQueryBuilder('s')
      .innerJoin(
        `(
          SELECT DISTINCT e.student_id
          FROM "school_class_enrollments" e
          INNER JOIN "school_class_teachers" sct
            ON sct.school_class_id = e.school_class_id
          INNER JOIN "memberships" m
            ON m.employee_id = sct.employee_id
          WHERE m.user_id = :uid
            AND m.organization_id = :orgId
            AND m."isActive" = true
            AND e.organization_id = :orgId
            AND e."isActive" = true
            AND e.left_at IS NULL
        )`,
        'visible_students',
        'visible_students.student_id = s.id',
      )
      .where('s.id = :sid', { sid: studentId })
      .andWhere('s.organization_id = :orgId', { orgId: organizationId })
      .setParameter('uid', userId)
      .getOne();

    if (!row) {
      throw new ForbiddenException('Not allowed to access this student');
    }
  }

  /**
   * Throws ForbiddenException unless the calling user may access the given
   * school class — admin roles see all, teachers only their own classes
   * (via school_class_teachers ← memberships ← users). Used by
   * classroom-scoped record-keeping endpoints to prevent a teacher from
   * peeking into another class's data via filter args.
   */
  async assertSchoolClassVisibleToUser(
    schoolClassId: string,
    userId: string,
    roles: string[],
    isSuperAdmin: boolean,
    organizationId: string,
  ): Promise<void> {
    if (this.isStudentAdminUser(roles, isSuperAdmin)) {
      // Admins only need an org-membership check; the class itself is
      // looked up by the caller, so verifying existence is enough.
      const exists = await this.studentRepo.manager
        .createQueryBuilder()
        .from('school_classes', 'sc')
        .where('sc.id = :sid', { sid: schoolClassId })
        .andWhere('sc.organization_id = :orgId', { orgId: organizationId })
        .getRawOne();
      if (!exists) {
        throw new NotFoundException(`School class ${schoolClassId} not found`);
      }
      return;
    }

    const row = await this.studentRepo.manager
      .createQueryBuilder()
      .from('school_class_teachers', 'sct')
      .innerJoin('memberships', 'm', 'm.employee_id = sct.employee_id')
      .where('sct.school_class_id = :sid', { sid: schoolClassId })
      .andWhere('m.user_id = :uid', { uid: userId })
      .andWhere('m.organization_id = :orgId', { orgId: organizationId })
      .andWhere('m."isActive" = true')
      .select('1')
      .getRawOne();

    if (!row) {
      throw new ForbiddenException('Not allowed to access this school class');
    }
  }

  async findOne(id: string, organizationId: string): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: ['admissionStage'],
    });
    if (!student) {
      throw new NotFoundException(`Student ${id} not found`);
    }
    return student;
  }

  async update(
    input: UpdateStudentInput,
    organizationId: string,
  ): Promise<Student> {
    const student = await this.findOne(input.id, organizationId);
    Object.assign(student, input);
    await this.studentRepo.save(student);
    return this.findOne(input.id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const student = await this.findOne(id, organizationId);
    student.isActive = false;
    await this.studentRepo.save(student);
    return true;
  }

  async moveToStage(
    studentId: string,
    stageId: string,
    organizationId: string,
  ): Promise<Student> {
    const student = await this.findOne(studentId, organizationId);
    const stage = await this.stagesRepo.findOne({
      where: { id: stageId, organizationId },
    });
    if (!stage) {
      throw new NotFoundException(`Admission stage ${stageId} not found`);
    }

    student.admissionStageId = stage.id;
    if (
      stage.stageType === AdmissionStageType.ENROLLED &&
      !student.enrollmentDate
    ) {
      student.enrollmentDate = DateTime.now().toISODate();
    }

    await this.studentRepo.save(student);
    return this.findOne(studentId, organizationId);
  }
}
