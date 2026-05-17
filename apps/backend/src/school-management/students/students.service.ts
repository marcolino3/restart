import { Injectable, NotFoundException } from '@nestjs/common';
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
