import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GradeLevel } from './entities/grade-level.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { CreateGradeLevelInput } from './dto/create-grade-level.input';
import { UpdateGradeLevelInput } from './dto/update-grade-level.input';
import { ReorderGradeLevelsInput } from './dto/reorder-grade-levels.input';

@Injectable()
export class GradeLevelsService {
  constructor(
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(SchoolClass)
    private readonly schoolClassRepo: Repository<SchoolClass>,
  ) {}

  private assertValidAgeRange(
    ageMin?: number | null,
    ageMax?: number | null,
  ): void {
    if (ageMin != null && ageMax != null && ageMax < ageMin) {
      throw new BadRequestException('ageMax must not be smaller than ageMin');
    }
  }

  async create(
    input: CreateGradeLevelInput,
    organizationId: string,
  ): Promise<GradeLevel> {
    this.assertValidAgeRange(input.ageMin, input.ageMax);
    const existing = await this.gradeLevelRepo.findOne({
      where: { organizationId, name: input.name },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        return this.gradeLevelRepo.save(existing);
      }
      throw new ConflictException(`Grade level "${input.name}" already exists`);
    }

    const gradeLevel = this.gradeLevelRepo.create({
      ...input,
      organizationId,
    });
    return this.gradeLevelRepo.save(gradeLevel);
  }

  async findAllByOrgId(organizationId: string): Promise<GradeLevel[]> {
    const levels = await this.gradeLevelRepo.find({
      where: { organizationId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    if (levels.length === 0) return levels;

    const ids = levels.map((l) => l.id);

    const classRows: Array<{ gl_id: string; class_count: string }> =
      await this.schoolClassRepo
        .createQueryBuilder('sc')
        .innerJoin('sc.gradeLevels', 'gl')
        .select('gl.id', 'gl_id')
        .addSelect('COUNT(DISTINCT sc.id)', 'class_count')
        .where('sc.organizationId = :organizationId', { organizationId })
        .andWhere('sc.isActive = true')
        .andWhere('gl.id IN (:...ids)', { ids })
        .groupBy('gl.id')
        .getRawMany();

    const studentRows: Array<{ gl_id: string; student_count: string }> =
      await this.schoolClassRepo
        .createQueryBuilder('sc')
        .innerJoin('sc.gradeLevels', 'gl')
        .innerJoin(
          'school_class_enrollments',
          'e',
          'e.school_class_id = sc.id AND e.left_at IS NULL AND e."isActive" = true',
        )
        .select('gl.id', 'gl_id')
        .addSelect('COUNT(DISTINCT e.student_id)', 'student_count')
        .where('sc.organizationId = :organizationId', { organizationId })
        .andWhere('sc.isActive = true')
        .andWhere('gl.id IN (:...ids)', { ids })
        .groupBy('gl.id')
        .getRawMany();

    const classCounts = new Map(
      classRows.map((r) => [r.gl_id, Number(r.class_count)]),
    );
    const studentCounts = new Map(
      studentRows.map((r) => [r.gl_id, Number(r.student_count)]),
    );

    return levels.map((level) => {
      level.classCount = classCounts.get(level.id) ?? 0;
      level.studentCount = studentCounts.get(level.id) ?? 0;
      return level;
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
    this.assertValidAgeRange(
      input.ageMin !== undefined ? input.ageMin : gradeLevel.ageMin,
      input.ageMax !== undefined ? input.ageMax : gradeLevel.ageMax,
    );
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

  async reorder(
    input: ReorderGradeLevelsInput,
    organizationId: string,
  ): Promise<GradeLevel[]> {
    const levels = await this.gradeLevelRepo.find({
      where: { id: In(input.ids), organizationId, isActive: true },
    });
    if (levels.length !== input.ids.length) {
      throw new NotFoundException(
        'One or more grade levels not found in this organization',
      );
    }
    const byId = new Map(levels.map((l) => [l.id, l]));
    const toSave = input.ids.map((id, index) => {
      const level = byId.get(id)!;
      level.sortOrder = index;
      return level;
    });
    await this.gradeLevelRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }
}
