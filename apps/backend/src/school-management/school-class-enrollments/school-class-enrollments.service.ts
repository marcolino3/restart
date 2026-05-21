import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { SchoolClassEnrollment } from './entities/school-class-enrollment.entity';
import { CreateSchoolClassEnrollmentInput } from './dto/create-school-class-enrollment.input';
import { TransferStudentInput } from './dto/transfer-student.input';
import { UpdateSchoolClassEnrollmentInput } from './dto/update-school-class-enrollment.input';

@Injectable()
export class SchoolClassEnrollmentsService {
  constructor(
    @InjectRepository(SchoolClassEnrollment)
    private readonly enrollmentRepo: Repository<SchoolClassEnrollment>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolClass)
    private readonly schoolClassRepo: Repository<SchoolClass>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    input: CreateSchoolClassEnrollmentInput,
    organizationId: string,
  ): Promise<SchoolClassEnrollment> {
    const enrollment = this.enrollmentRepo.create({
      ...input,
      organizationId,
    });
    const saved = await this.enrollmentRepo.save(enrollment);
    return this.findOne(saved.id, organizationId);
  }

  async findByStudentId(
    studentId: string,
    organizationId: string,
  ): Promise<SchoolClassEnrollment[]> {
    return this.enrollmentRepo.find({
      where: { studentId, organizationId, isActive: true },
      relations: ['schoolClass', 'schoolClass.gradeLevels'],
      order: { enrolledAt: 'DESC' },
    });
  }

  /**
   * Aktive Einschreibungen einer Klasse (leftAt IS NULL).
   * Wird für die Lesson-First Bulk-Eingabe gebraucht: "Wer ist gerade in dieser Klasse?"
   */
  async findActiveBySchoolClassId(
    schoolClassId: string,
    organizationId: string,
  ): Promise<SchoolClassEnrollment[]> {
    return this.enrollmentRepo.find({
      where: {
        schoolClassId,
        organizationId,
        isActive: true,
        leftAt: IsNull(),
      },
      relations: ['student'],
      order: { enrolledAt: 'ASC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<SchoolClassEnrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: ['schoolClass', 'schoolClass.gradeLevels', 'student'],
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${id} not found`);
    }
    return enrollment;
  }

  async update(
    input: UpdateSchoolClassEnrollmentInput,
    organizationId: string,
  ): Promise<SchoolClassEnrollment> {
    const enrollment = await this.findOne(input.id, organizationId);
    if (input.leftAt !== undefined) {
      enrollment.leftAt = input.leftAt;
    }
    await this.enrollmentRepo.save(enrollment);
    return this.findOne(input.id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const enrollment = await this.findOne(id, organizationId);
    enrollment.isActive = false;
    await this.enrollmentRepo.save(enrollment);
    return true;
  }

  /**
   * Schüler ohne aktive Klassen-Einschreibung in dieser Org.
   * (Für das Kanban: "Nicht zugewiesen"-Spalte)
   */
  async findUnassignedStudents(organizationId: string): Promise<Student[]> {
    return this.studentRepo
      .createQueryBuilder('s')
      .where('s.organization_id = :orgId', { orgId: organizationId })
      .andWhere('s."isArchived" = false')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM "school_class_enrollments" e
          WHERE e.student_id = s.id
            AND e.organization_id = :orgId
            AND e."isActive" = true
            AND e.left_at IS NULL
        )`,
      )
      .orderBy('s."lastName"', 'ASC')
      .addOrderBy('s."firstName"', 'ASC')
      .getMany();
  }

  /**
   * Verschiebt einen Schüler in eine andere (oder keine) Klasse.
   *
   * In einer Transaktion:
   *  - jede aktuelle aktive Einschreibung (leftAt IS NULL) wird beendet
   *    (leftAt = transferDate).
   *  - Wenn targetSchoolClassId gesetzt: neue Einschreibung wird erstellt.
   *  - Wenn targetSchoolClassId null: Schüler wird nur "ausgetragen".
   *
   * Idempotent: drop auf dieselbe Klasse → no-op (gibt die bestehende
   * Einschreibung zurück).
   */
  async transferStudent(
    input: TransferStudentInput,
    organizationId: string,
  ): Promise<SchoolClassEnrollment | null> {
    const studentExists = await this.studentRepo.exists({
      where: { id: input.studentId, organizationId },
    });
    if (!studentExists) {
      throw new NotFoundException(`Student ${input.studentId} not found`);
    }

    if (input.targetSchoolClassId) {
      const classExists = await this.schoolClassRepo.exists({
        where: { id: input.targetSchoolClassId, organizationId },
      });
      if (!classExists) {
        throw new NotFoundException(
          `School class ${input.targetSchoolClassId} not found`,
        );
      }
    }

    const today = input.transferDate ?? new Date().toISOString().slice(0, 10);

    return this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(SchoolClassEnrollment);

      const active = await repo.find({
        where: {
          studentId: input.studentId,
          organizationId,
          isActive: true,
          leftAt: IsNull(),
        },
      });

      // Idempotenz: Drop auf dieselbe Klasse → no-op
      if (
        input.targetSchoolClassId &&
        active.length === 1 &&
        active[0].schoolClassId === input.targetSchoolClassId
      ) {
        return repo.findOne({
          where: { id: active[0].id, organizationId },
          relations: ['schoolClass', 'student'],
        });
      }

      // Alte aktive Einschreibungen beenden
      for (const enrollment of active) {
        enrollment.leftAt = today;
        await repo.save(enrollment);
      }

      // Wenn Ziel null → nur austragen
      if (!input.targetSchoolClassId) {
        return null;
      }

      const created = repo.create({
        studentId: input.studentId,
        schoolClassId: input.targetSchoolClassId,
        enrolledAt: today,
        organizationId,
      });
      const saved = await repo.save(created);
      return repo.findOne({
        where: { id: saved.id, organizationId },
        relations: ['schoolClass', 'student'],
      });
    });
  }
}
