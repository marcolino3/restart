import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { SchoolClassEnrollment } from './entities/school-class-enrollment.entity';
import { CreateSchoolClassEnrollmentInput } from './dto/create-school-class-enrollment.input';
import { UpdateSchoolClassEnrollmentInput } from './dto/update-school-class-enrollment.input';

@Injectable()
export class SchoolClassEnrollmentsService {
  constructor(
    @InjectRepository(SchoolClassEnrollment)
    private readonly enrollmentRepo: Repository<SchoolClassEnrollment>,
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
}
