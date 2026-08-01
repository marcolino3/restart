import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
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
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * A child may only be placed in a subgroup its class actually covers.
   *
   * Accepts either a stage the class carries directly, or a child of one —
   * a class assigned "Unterstufe" takes US1–US3. Without this a caller could
   * park a child in an unrelated stage, and the progress screen would then
   * offer the wrong curriculum for it.
   */
  private async assertGradeLevelBelongsToClass(
    gradeLevelId: string,
    schoolClassId: string | null,
    organizationId: string,
  ): Promise<void> {
    const gradeLevel = await this.gradeLevelRepo.findOne({
      where: { id: gradeLevelId, organizationId },
    });
    if (!gradeLevel) {
      throw new NotFoundException(`Grade level ${gradeLevelId} not found`);
    }
    if (!schoolClassId) {
      throw new BadRequestException(
        'A grade level can only be set together with a school class',
      );
    }

    const schoolClass = await this.schoolClassRepo.findOne({
      where: { id: schoolClassId, organizationId },
      relations: { gradeLevels: true },
    });
    const classLevelIds = new Set(
      (schoolClass?.gradeLevels ?? []).map((gl) => gl.id),
    );

    const allowed =
      classLevelIds.has(gradeLevel.id) ||
      (gradeLevel.parentId != null && classLevelIds.has(gradeLevel.parentId));
    if (!allowed) {
      throw new BadRequestException(
        `Grade level ${gradeLevelId} does not belong to school class ${schoolClassId}`,
      );
    }
  }

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

    if (input.gradeLevelId) {
      await this.assertGradeLevelBelongsToClass(
        input.gradeLevelId,
        input.targetSchoolClassId ?? null,
        organizationId,
      );
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

      // Gleiche Klasse: kein Wechsel, sondern höchstens eine andere
      // Untergruppe. Eine neue Einschreibung anzulegen würde die Historie
      // zerschneiden ("Kind hat die Klasse gewechselt"), obwohl es nur
      // innerhalb der Klasse verschoben wurde.
      if (
        input.targetSchoolClassId &&
        active.length === 1 &&
        active[0].schoolClassId === input.targetSchoolClassId
      ) {
        const current = active[0];
        if (
          input.gradeLevelId !== undefined &&
          (current.gradeLevelId ?? null) !== (input.gradeLevelId ?? null)
        ) {
          current.gradeLevelId = input.gradeLevelId ?? null;
          await repo.save(current);
        }
        return repo.findOne({
          where: { id: current.id, organizationId },
          relations: ['schoolClass', 'student', 'gradeLevel'],
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
        gradeLevelId: input.gradeLevelId ?? null,
        enrolledAt: today,
        organizationId,
      });
      const saved = await repo.save(created);
      return repo.findOne({
        where: { id: saved.id, organizationId },
        relations: ['schoolClass', 'student', 'gradeLevel'],
      });
    });
  }
}
