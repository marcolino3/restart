import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StudentRecordCategory } from './entities/student-record-category.entity';
import { CreateStudentRecordCategoryInput } from './dto/create-student-record-category.input';
import { UpdateStudentRecordCategoryInput } from './dto/update-student-record-category.input';

@Injectable()
export class StudentRecordCategoriesService {
  constructor(
    @InjectRepository(StudentRecordCategory)
    private readonly categoriesRepo: Repository<StudentRecordCategory>,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<StudentRecordCategory[]> {
    return this.categoriesRepo.find({
      where: {
        organizationId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<StudentRecordCategory> {
    const category = await this.categoriesRepo.findOne({
      where: { id, organizationId },
    });
    if (!category) {
      throw new NotFoundException(`Student record category ${id} not found`);
    }
    return category;
  }

  async create(
    input: CreateStudentRecordCategoryInput,
    organizationId: string,
  ): Promise<StudentRecordCategory> {
    let position = input.position;
    if (position === undefined) {
      const max = await this.categoriesRepo
        .createQueryBuilder('c')
        .select('MAX(c.position)', 'max')
        .where('c.organization_id = :orgId', { orgId: organizationId })
        .getRawOne<{ max: number | null }>();
      position = (max?.max ?? -1) + 1;
    }

    const category = this.categoriesRepo.create({
      ...input,
      position,
      organizationId,
    });
    return this.categoriesRepo.save(category);
  }

  async update(
    input: UpdateStudentRecordCategoryInput,
    organizationId: string,
  ): Promise<StudentRecordCategory> {
    const category = await this.findOne(input.id, organizationId);
    const { id: _id, ...rest } = input;
    Object.assign(category, rest);
    return this.categoriesRepo.save(category);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const category = await this.findOne(id, organizationId);
    category.isArchived = true;
    await this.categoriesRepo.save(category);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<StudentRecordCategory[]> {
    const categories = await this.categoriesRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (categories.length !== ids.length) {
      throw new NotFoundException(
        'One or more student record categories not found for this organization',
      );
    }
    const byId = new Map(categories.map((c) => [c.id, c]));
    const toSave = ids.map((id, index) => {
      const category = byId.get(id)!;
      category.position = index;
      return category;
    });
    await this.categoriesRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }
}
