import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '@/school-management/students/entities/student.entity';
import { StudentRecordEntry } from './entities/student-record-entry.entity';
import { StudentRecordCategory } from './entities/student-record-category.entity';
import { CreateStudentRecordEntryInput } from './dto/create-student-record-entry.input';
import { UpdateStudentRecordEntryInput } from './dto/update-student-record-entry.input';

@Injectable()
export class StudentRecordEntriesService {
  constructor(
    @InjectRepository(StudentRecordEntry)
    private readonly repo: Repository<StudentRecordEntry>,
    @InjectRepository(Student)
    private readonly studentsRepo: Repository<Student>,
    @InjectRepository(StudentRecordCategory)
    private readonly categoriesRepo: Repository<StudentRecordCategory>,
  ) {}

  /** Confirms the student belongs to this org — prevents cross-tenant probing. */
  private async assertStudentInOrg(
    studentId: string,
    organizationId: string,
  ): Promise<void> {
    const student = await this.studentsRepo.findOne({
      where: { id: studentId, organizationId },
      select: ['id'],
    });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }
  }

  /** Confirms an optional category belongs to this org. */
  private async assertCategoryInOrg(
    categoryId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!categoryId) return;
    const category = await this.categoriesRepo.findOne({
      where: { id: categoryId, organizationId },
      select: ['id'],
    });
    if (!category) {
      throw new BadRequestException(
        `Student record category ${categoryId} not found`,
      );
    }
  }

  async findByStudent(
    studentId: string,
    organizationId: string,
  ): Promise<StudentRecordEntry[]> {
    await this.assertStudentInOrg(studentId, organizationId);
    return this.repo.find({
      where: { studentId, organizationId },
      relations: ['category', 'authorMembership', 'authorMembership.user'],
      order: { occurredAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(
    input: CreateStudentRecordEntryInput,
    organizationId: string,
    authorMembershipId: string | null,
  ): Promise<StudentRecordEntry> {
    await this.assertStudentInOrg(input.studentId, organizationId);
    await this.assertCategoryInOrg(input.categoryId ?? null, organizationId);

    const entity = this.repo.create({
      organizationId,
      studentId: input.studentId,
      categoryId: input.categoryId ?? null,
      title: input.title?.trim() || null,
      content: input.content?.trim() || null,
      occurredAt: new Date(input.occurredAt),
      isConfidential: input.isConfidential ?? true,
      authorMembershipId: authorMembershipId ?? null,
    });
    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, organizationId);
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<StudentRecordEntry> {
    const entry = await this.repo.findOne({
      where: { id, organizationId },
      relations: ['category', 'authorMembership', 'authorMembership.user'],
    });
    if (!entry) {
      throw new NotFoundException(`Student record entry ${id} not found`);
    }
    return entry;
  }

  async update(
    input: UpdateStudentRecordEntryInput,
    organizationId: string,
  ): Promise<StudentRecordEntry> {
    const existing = await this.repo.findOne({
      where: { id: input.id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException(`Student record entry ${input.id} not found`);
    }

    if (input.categoryId !== undefined) {
      await this.assertCategoryInOrg(input.categoryId ?? null, organizationId);
      existing.categoryId = input.categoryId ?? null;
    }
    if (input.title !== undefined) {
      existing.title = input.title?.toString().trim() || null;
    }
    if (input.content !== undefined) {
      existing.content = input.content?.toString().trim() || null;
    }
    if (input.occurredAt !== undefined) {
      existing.occurredAt = new Date(input.occurredAt);
    }
    if (input.isConfidential !== undefined) {
      existing.isConfidential = input.isConfidential;
    }
    await this.repo.save(existing);
    return this.findOne(existing.id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const existing = await this.repo.findOne({
      where: { id, organizationId },
      select: ['id'],
    });
    if (!existing) {
      throw new NotFoundException(`Student record entry ${id} not found`);
    }
    await this.repo.delete({ id, organizationId });
    return true;
  }
}
