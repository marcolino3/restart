import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CurriculumNode } from '../entities/curriculum-node.entity';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import { CreateLessonRecordInput } from './dto/create-lesson-record.input';
import { CreateLessonRecordsBulkInput } from './dto/create-lesson-records-bulk.input';
import { LessonRecordsFilterInput } from './dto/lesson-records-filter.input';
import { UpdateLessonRecordInput } from './dto/update-lesson-record.input';
import { LessonRecord } from './entities/lesson-record.entity';

@Injectable()
export class LessonRecordsService {
  constructor(
    @InjectRepository(LessonRecord)
    private readonly recordsRepo: Repository<LessonRecord>,
    @InjectRepository(CurriculumNode)
    private readonly nodesRepo: Repository<CurriculumNode>,
    @InjectRepository(Student)
    private readonly studentsRepo: Repository<Student>,
    @InjectRepository(SchoolClassEnrollment)
    private readonly enrollmentsRepo: Repository<SchoolClassEnrollment>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, organizationId: string): Promise<LessonRecord> {
    const record = await this.recordsRepo.findOne({
      where: { id, organizationId },
      relations: ['lesson', 'student', 'recordedBy'],
    });
    if (!record) {
      throw new NotFoundException(`Lesson record ${id} not found`);
    }
    return record;
  }

  async find(
    filter: LessonRecordsFilterInput,
    organizationId: string,
  ): Promise<LessonRecord[]> {
    const qb = this.recordsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.lesson', 'lesson')
      .leftJoinAndSelect('lesson.translations', 'lessonTranslations')
      .leftJoinAndSelect('r.student', 'student')
      .where('r.organization_id = :orgId', { orgId: organizationId });

    if (filter.studentId) {
      qb.andWhere('r.student_id = :studentId', { studentId: filter.studentId });
    }
    if (filter.lessonId) {
      qb.andWhere('r.lesson_id = :lessonId', { lessonId: filter.lessonId });
    }
    if (filter.recordedFrom) {
      qb.andWhere('r.recorded_at >= :from', { from: filter.recordedFrom });
    }
    if (filter.recordedTo) {
      qb.andWhere('r.recorded_at <= :to', { to: filter.recordedTo });
    }
    if (filter.statuses && filter.statuses.length > 0) {
      qb.andWhere('r.status IN (:...statuses)', { statuses: filter.statuses });
    }
    if (filter.schoolClassId) {
      qb.andWhere(
        `r.student_id IN (
          SELECT e.student_id FROM "school_class_enrollments" e
          WHERE e.school_class_id = :scId
            AND e.organization_id = :orgId
            AND (e.left_at IS NULL OR e.left_at >= COALESCE(:from, CURRENT_DATE))
        )`,
        { scId: filter.schoolClassId, from: filter.recordedFrom ?? null },
      );
    }

    return qb.orderBy('r.recorded_at', 'DESC').getMany();
  }

  /**
   * Aktueller Status pro Kind × Lektion = der neueste Record (by recorded_at, fallback createdAt).
   */
  async findCurrent(
    studentId: string,
    lessonId: string,
    organizationId: string,
  ): Promise<LessonRecord | null> {
    return this.recordsRepo.findOne({
      where: { studentId, lessonId, organizationId },
      order: { recordedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(
    input: CreateLessonRecordInput,
    organizationId: string,
    recordedById: string,
  ): Promise<LessonRecord> {
    await this.assertLessonInOrg(input.lessonId, organizationId);
    await this.assertStudentInOrg(input.studentId, organizationId);
    if (input.schoolClassEnrollmentId) {
      await this.assertEnrollmentInOrg(
        input.schoolClassEnrollmentId,
        organizationId,
      );
    }

    const record = this.recordsRepo.create({
      studentId: input.studentId,
      lessonId: input.lessonId,
      recordedAt: input.recordedAt,
      status: input.status,
      note: input.note ?? null,
      schoolClassEnrollmentId: input.schoolClassEnrollmentId ?? null,
      recordedById,
      organizationId,
    });
    return this.recordsRepo.save(record);
  }

  /**
   * Lesson-First Bulk-Eingabe: eine Lektion → N Kinder → ein Status.
   * Schreibt eine Reihe pro Kind in einer Transaktion.
   */
  async createBulk(
    input: CreateLessonRecordsBulkInput,
    organizationId: string,
    recordedById: string,
  ): Promise<LessonRecord[]> {
    await this.assertLessonInOrg(input.lessonId, organizationId);

    const students = await this.studentsRepo.find({
      where: { id: In(input.studentIds), organizationId },
      select: ['id'],
    });
    if (students.length !== input.studentIds.length) {
      throw new BadRequestException(
        'One or more students not found in this organization',
      );
    }

    return this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(LessonRecord);
      const rows = input.studentIds.map((sid) =>
        repo.create({
          studentId: sid,
          lessonId: input.lessonId,
          recordedAt: input.recordedAt,
          status: input.status,
          note: input.note ?? null,
          recordedById,
          organizationId,
        }),
      );
      return repo.save(rows);
    });
  }

  async update(
    input: UpdateLessonRecordInput,
    organizationId: string,
  ): Promise<LessonRecord> {
    const record = await this.findById(input.id, organizationId);
    if (input.recordedAt !== undefined) record.recordedAt = input.recordedAt;
    if (input.status !== undefined) record.status = input.status;
    if (input.note !== undefined) record.note = input.note;
    return this.recordsRepo.save(record);
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const record = await this.findById(id, organizationId);
    await this.recordsRepo.delete({ id: record.id, organizationId });
    return true;
  }

  private async assertLessonInOrg(
    lessonId: string,
    organizationId: string,
  ): Promise<void> {
    const lesson = await this.nodesRepo.findOne({
      where: { id: lessonId, organizationId },
      select: ['id', 'nodeType'],
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found`);
    }
    if (lesson.nodeType !== CurriculumNodeType.LESSON) {
      throw new BadRequestException(
        `Curriculum node ${lessonId} is ${lesson.nodeType}, expected LESSON`,
      );
    }
  }

  private async assertStudentInOrg(
    studentId: string,
    organizationId: string,
  ): Promise<void> {
    const exists = await this.studentsRepo.exists({
      where: { id: studentId, organizationId },
    });
    if (!exists) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }
  }

  private async assertEnrollmentInOrg(
    enrollmentId: string,
    organizationId: string,
  ): Promise<void> {
    const exists = await this.enrollmentsRepo.exists({
      where: { id: enrollmentId, organizationId },
    });
    if (!exists) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }
  }
}
