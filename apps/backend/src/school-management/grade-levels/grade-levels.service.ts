import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeLevel } from './entities/grade-level.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { CreateGradeLevelInput } from './dto/create-grade-level.input';
import { UpdateGradeLevelInput } from './dto/update-grade-level.input';

@Injectable()
export class GradeLevelsService {
  constructor(
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(SchoolClass)
    private readonly schoolClassRepo: Repository<SchoolClass>,
  ) {}

  async create(
    input: CreateGradeLevelInput,
    organizationId: string,
  ): Promise<GradeLevel> {
    const existing = await this.gradeLevelRepo.findOne({
      where: { organizationId, name: input.name },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        return this.gradeLevelRepo.save(existing);
      }
      throw new ConflictException(
        `Grade level "${input.name}" already exists`,
      );
    }

    const gradeLevel = this.gradeLevelRepo.create({
      ...input,
      organizationId,
    });
    return this.gradeLevelRepo.save(gradeLevel);
  }

  async findAllByOrgId(organizationId: string): Promise<GradeLevel[]> {
    return this.gradeLevelRepo.find({
      where: { organizationId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<GradeLevel> {
    const gradeLevel = await this.gradeLevelRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!gradeLevel) {
      throw new NotFoundException(`GradeLevel ${id} not found`);
    }
    return gradeLevel;
  }

  async update(
    input: UpdateGradeLevelInput,
    organizationId: string,
  ): Promise<GradeLevel> {
    const gradeLevel = await this.findOne(input.id, organizationId);
    Object.assign(gradeLevel, input);
    return this.gradeLevelRepo.save(gradeLevel);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const gradeLevel = await this.findOne(id, organizationId);

    const usageCount = await this.schoolClassRepo
      .createQueryBuilder('sc')
      .innerJoin('sc.gradeLevels', 'gl', 'gl.id = :glId', { glId: id })
      .where('sc.organizationId = :organizationId', { organizationId })
      .andWhere('sc.isActive = true')
      .getCount();

    if (usageCount > 0) {
      throw new ConflictException(
        `Grade level "${gradeLevel.name}" is assigned to ${usageCount} class(es) and cannot be deleted`,
      );
    }

    gradeLevel.isActive = false;
    await this.gradeLevelRepo.save(gradeLevel);
    return true;
  }
}
